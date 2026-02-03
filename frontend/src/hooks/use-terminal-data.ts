import { useMemo } from "react";
import { useTickerStore } from "@/store/use-ticker-store";
import { useThrottledValue } from "@/hooks/use-throttled-value";
import { ASSET_CLASSES, AssetClassId } from "@/lib/ticker-mapping";
import type { Bar } from "@/types/common.types";

export interface AssetClassTickers {
  id: AssetClassId;
  title: string;
  symbols: string[];
  avgChange: number;
  openInterest: number;
}

function getBasePrice(bars: Bar[] | undefined, latest?: Bar): number | null {
  if (bars && bars.length > 0) return bars[0].open;
  if (latest) return latest.open || latest.close;
  return null;
}

function getChangePercent(bars: Bar[] | undefined, latest?: Bar): number {
  if (!latest) return 0;
  const base = getBasePrice(bars, latest);
  if (!base) return 0;
  return ((latest.close - base) / base) * 100;
}

export function useTerminalData() {
  const mode = useTickerStore((state) => state.mode);
  const rawEntities = useTickerStore((state) => state.entitiesByMode[mode]);
  const rawSeries = useTickerStore((state) => state.seriesByMode[mode]);
  const rawIndex = useTickerStore((state) => state.byAssetClassByMode[mode]);
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
        openInterest: 1.0,
      };
    });

    ASSET_CLASSES.forEach((assetClass) => {
      const symbols = index[assetClass.id] || [];
      const sorted = [...symbols].sort((a, b) => {
        const aEntity = entities[a];
        const bEntity = entities[b];
        const aSeries = series[a];
        const bSeries = series[b];
        const aChange = getChangePercent(aSeries, aEntity?.latestBar);
        const bChange = getChangePercent(bSeries, bEntity?.latestBar);
        return bChange - aChange;
      });

      dataByClass[assetClass.id].symbols = sorted;

      const totalChange = sorted.reduce((sum, symbol) => {
        const entity = entities[symbol];
        const bars = series[symbol];
        return sum + getChangePercent(bars, entity?.latestBar);
      }, 0);

      dataByClass[assetClass.id].avgChange =
        sorted.length > 0 ? totalChange / sorted.length : 0;
    });

    return ASSET_CLASSES.map((ac) => dataByClass[ac.id]);
  }, [entities, series, index]);

  return terminalData;
}
