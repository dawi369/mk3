import { useMemo } from "react";
import { useTickerStore } from "@/store/use-ticker-store";
import { useThrottledValue } from "@/hooks/use-throttled-value";
import { ASSET_CLASSES, AssetClassId } from "@/lib/ticker-mapping";
import { getChangeMetrics } from "@/lib/ticker-snapshot";
import type { SnapshotData } from "@/types/redis.types";
import type { Bar } from "@/types/common.types";

export interface AssetClassTickers {
  id: AssetClassId;
  title: string;
  symbols: string[];
  avgChange: number;
  openInterest?: number;
  openInterestPercent?: number;
}

function getChangePercent(
  bars: Bar[] | undefined,
  latest: Bar | undefined,
  snapshot: SnapshotData | undefined
): { value: number; valid: boolean } {
  const metrics = getChangeMetrics({ bars, latest, snapshot });
  return { value: metrics.changePercent, valid: metrics.hasReference };
}

export function useTerminalData() {
  const mode = useTickerStore((state) => state.mode);
  const rawEntities = useTickerStore((state) => state.entitiesByMode[mode]);
  const rawSeries = useTickerStore((state) => state.seriesByMode[mode]);
  const rawIndex = useTickerStore((state) => state.byAssetClassByMode[mode]);
  const snapshots = useTickerStore((state) => state.snapshotsBySymbol);
  const entities = useThrottledValue(rawEntities, 100);
  const series = useThrottledValue(rawSeries, 100);
  const index = rawIndex;

  const terminalData = useMemo(() => {
    const dataByClass: Record<AssetClassId, AssetClassTickers> = {} as Record<
      AssetClassId,
      AssetClassTickers
    >;

    ASSET_CLASSES.forEach((ac) => {
      dataByClass[ac.id] = {
        id: ac.id,
        title: ac.title,
        symbols: [],
        avgChange: 0,
        openInterest: undefined,
        openInterestPercent: undefined,
      };
    });

    const openInterestByClass: Record<AssetClassId, number> = {} as Record<
      AssetClassId,
      number
    >;

    ASSET_CLASSES.forEach((assetClass) => {
      const symbols = index[assetClass.id] || [];
      const sorted = [...symbols].sort((a, b) => {
        const aEntity = entities[a];
        const bEntity = entities[b];
        const aSeries = series[a];
        const bSeries = series[b];
        const aSnapshot = snapshots[a];
        const bSnapshot = snapshots[b];
        const aChange = getChangePercent(aSeries, aEntity?.latestBar, aSnapshot).value;
        const bChange = getChangePercent(bSeries, bEntity?.latestBar, bSnapshot).value;
        return bChange - aChange;
      });

      dataByClass[assetClass.id].symbols = sorted;

      const totalChange = sorted.reduce((sum, symbol) => {
        const entity = entities[symbol];
        const bars = series[symbol];
        const snapshot = snapshots[symbol];
        return sum + getChangePercent(bars, entity?.latestBar, snapshot).value;
      }, 0);

      const validChanges = sorted.filter((symbol) => {
        const entity = entities[symbol];
        const bars = series[symbol];
        const snapshot = snapshots[symbol];
        return getChangePercent(bars, entity?.latestBar, snapshot).valid;
      }).length;

      dataByClass[assetClass.id].avgChange =
        validChanges > 0 ? totalChange / validChanges : 0;

      const openInterestTotal = sorted.reduce((sum, symbol) => {
        const snapshot = snapshots[symbol];
        const oi = snapshot?.openInterest;
        return typeof oi === "number" ? sum + oi : sum;
      }, 0);

      dataByClass[assetClass.id].openInterest =
        openInterestTotal > 0 ? openInterestTotal : undefined;

      openInterestByClass[assetClass.id] = openInterestTotal;
    });

    const totalOpenInterest = Object.values(openInterestByClass).reduce(
      (sum, value) => sum + value,
      0
    );

    if (totalOpenInterest > 0) {
      ASSET_CLASSES.forEach((assetClass) => {
        const classTotal = openInterestByClass[assetClass.id];
        dataByClass[assetClass.id].openInterestPercent =
          classTotal > 0 ? (classTotal / totalOpenInterest) * 100 : undefined;
      });
    }

    return ASSET_CLASSES.map((ac) => dataByClass[ac.id]);
  }, [entities, series, index, snapshots]);

  return terminalData;
}
