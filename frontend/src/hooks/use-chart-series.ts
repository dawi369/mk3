"use client";

import { useMemo, useRef } from "react";
import { useTickerStore } from "@/store/use-ticker-store";
import { useChartHistory } from "@/hooks/use-chart-history";
import { buildTickerSnapshot } from "@/lib/ticker-snapshot";
import { resampleBars } from "@/lib/bar-resample";
import {
  TIMEFRAME_MS,
  normalizeTimestamp,
  inferIntervalMs,
  mergeLatestIntoSeries,
  toCandleData,
  toLineData,
  buildSpreadSeries,
  formatDepth,
} from "@/lib/chart-utils";
import type { Bar } from "@/types/common.types";
import type { SpreadLeg, Timeframe, TickerMode } from "@/types/ticker.types";
import type { CandlestickData, LineData, Time } from "lightweight-charts";
import type { TickerSnapshot } from "@/types/ticker.types";

// ── Options ──────────────────────────────────────────────────────────────────

interface UseChartSeriesOptions {
  primarySymbol: string | null;
  comparisons: string[];
  spreadEnabled: boolean;
  spreadLegs: SpreadLeg[];
  timeframe: Timeframe;
  isOpen: boolean;
  mode: TickerMode;
  rangeOverride: { start: number; end: number } | null;
  displayCompare: boolean;
  displaySpread: boolean;
  showLegs: boolean;
  showSessionLevels: boolean;
}

// ── Return type ──────────────────────────────────────────────────────────────

interface UseChartSeriesReturn {
  chartData: CandlestickData<Time>[] | undefined;
  primaryLineData: LineData<Time>[];
  comparisonData: Record<string, LineData<Time>[]>;
  spreadData: LineData<Time>[];
  spreadValue: number | null;
  bars: Bar[] | undefined;
  depthInfo: {
    first: number;
    last: number;
    unit: string;
    depth: string;
    count: number;
  } | null;
  primarySnapshot: TickerSnapshot | null;
  sessionLevels:
    | { high?: number | null; low?: number | null; last?: number | null }
    | undefined;
  headerItems: { symbol: string; price: number; changePercent: number }[];
  overlaySymbols: string[];
  fitKey: string;
  visibleBars: number;
  secondsVisible: boolean;
  isHistoryReady: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useChartSeries({
  primarySymbol,
  comparisons,
  spreadEnabled,
  spreadLegs,
  timeframe,
  isOpen,
  mode,
  rangeOverride,
  displayCompare,
  displaySpread,
  showLegs,
  showSessionLevels,
}: UseChartSeriesOptions): UseChartSeriesReturn {
  const liveSeriesBySymbol = useTickerStore((state) => state.seriesByMode[mode]);
  const entities = useTickerStore((state) => state.entitiesByMode[mode]);
  const snapshots = useTickerStore((state) => state.snapshotsBySymbol);
  const sessions = useTickerStore((state) => state.sessionsBySymbol);

  // Merge cache refs
  const latestSignatureRef = useRef<Map<string, string>>(new Map());
  const mergedHistoryRef = useRef<Map<string, { key: string; series: Bar[] }>>(new Map());

  // ── Ordered symbols ────────────────────────────────────────────────────

  const orderedSymbols = useMemo(() => {
    if (!primarySymbol) return comparisons;
    return [primarySymbol, ...comparisons];
  }, [primarySymbol, comparisons]);

  const headerSymbols = useMemo(() => {
    if (spreadEnabled && spreadLegs.length > 0) {
      return spreadLegs.map((leg) => leg.symbol);
    }
    return orderedSymbols;
  }, [orderedSymbols, spreadEnabled, spreadLegs]);

  const chartSymbols = useMemo(() => {
    const symbols = new Set<string>();
    if (primarySymbol) symbols.add(primarySymbol);
    for (const symbol of comparisons) symbols.add(symbol);
    if (spreadEnabled) {
      for (const leg of spreadLegs) symbols.add(leg.symbol);
    }
    return Array.from(symbols);
  }, [primarySymbol, comparisons, spreadEnabled, spreadLegs]);

  // ── History fetch ──────────────────────────────────────────────────────

  const { seriesBySymbol: historySeriesBySymbol, isReady: historyReady } = useChartHistory({
    symbols: chartSymbols,
    timeframe,
    enabled: isOpen,
    mode,
    rangeOverride,
  });

  // ── Resolved series (history fallback to live) ─────────────────────────

  const resolvedSeriesBySymbol = useMemo(() => {
    const map: Record<string, Bar[]> = {};
    for (const symbol of chartSymbols) {
      const history = historySeriesBySymbol[symbol];
      map[symbol] = history && history.length > 0 ? history : liveSeriesBySymbol[symbol] ?? [];
    }
    return map;
  }, [chartSymbols, historySeriesBySymbol, liveSeriesBySymbol]);

  // ── Chart series (with live-merge + resampling) ────────────────────────

  const chartSeriesBySymbol = useMemo(() => {
    const map: Record<string, Bar[]> = {};
    for (const symbol of chartSymbols) {
      const history = historySeriesBySymbol[symbol];
      if (history && history.length > 0) {
        const targetMs = TIMEFRAME_MS[timeframe];
        const latest = entities[symbol]?.latestBar;
        if (!latest) {
          map[symbol] = history;
          continue;
        }

        const signature = `${latest.startTime}:${latest.high}:${latest.low}:${latest.close}:${latest.volume}:${latest.trades}`;
        const historyTail = history[history.length - 1];
        const historyKey = `${history.length}:${historyTail?.startTime ?? 0}:${historyTail?.close ?? 0}`;
        const cacheKey = `${historyKey}:${targetMs}`;
        const cached = mergedHistoryRef.current.get(symbol);
        const lastSignature = latestSignatureRef.current.get(symbol);

        if (cached && cached.key === cacheKey && lastSignature === signature) {
          map[symbol] = cached.series;
          continue;
        }

        const baseSeries = cached && cached.key === cacheKey ? cached.series : history;
        const merged = mergeLatestIntoSeries(baseSeries, latest, targetMs);
        latestSignatureRef.current.set(symbol, signature);
        mergedHistoryRef.current.set(symbol, { key: cacheKey, series: merged });
        map[symbol] = merged;
        continue;
      }

      const live = liveSeriesBySymbol[symbol] ?? [];
      if (live.length === 0) {
        map[symbol] = [];
        continue;
      }

      const targetMs = TIMEFRAME_MS[timeframe];
      const inferredMs = inferIntervalMs(live);
      const needsResample = inferredMs !== null && Math.abs(inferredMs - targetMs) > targetMs * 0.2;
      map[symbol] = needsResample ? resampleBars(live, timeframe) : live;
    }
    return map;
  }, [chartSymbols, historySeriesBySymbol, liveSeriesBySymbol, timeframe, entities]);

  // ── Primary data ───────────────────────────────────────────────────────

  const bars = primarySymbol ? chartSeriesBySymbol[primarySymbol] : undefined;

  const primaryLineData = useMemo(() => {
    if (!bars || bars.length === 0) return [];
    return toLineData(bars);
  }, [bars]);

  const chartData: CandlestickData<Time>[] | undefined = useMemo(() => {
    if (!bars || bars.length === 0 || displayCompare || displaySpread) return undefined;
    return toCandleData(bars);
  }, [bars, displayCompare, displaySpread]);

  // ── Depth info ─────────────────────────────────────────────────────────

  const depthInfo = useMemo(() => {
    if (!bars || bars.length === 0) return null;
    const first = normalizeTimestamp(bars[0].startTime);
    const last = normalizeTimestamp(bars[bars.length - 1].startTime);
    const unit = bars[bars.length - 1].startTime < 1e12 ? "s" : "ms";
    return {
      first,
      last,
      unit,
      depth: formatDepth(last - first),
      count: bars.length,
    };
  }, [bars]);

  // ── Snapshot & session levels ──────────────────────────────────────────

  const primarySnapshot = useMemo(() => {
    if (!primarySymbol) return null;
    const symbolBars = resolvedSeriesBySymbol[primarySymbol];
    const symbolEntity = entities[primarySymbol];
    return buildTickerSnapshot(
      primarySymbol,
      symbolBars,
      symbolEntity?.latestBar,
      snapshots[primarySymbol],
      sessions[primarySymbol]
    );
  }, [primarySymbol, resolvedSeriesBySymbol, entities, snapshots, sessions]);

  // Session levels: show session high/low/last on the chart.
  // Priority: 1) SnapshotData from Massive
  //           2) SessionData from the backend session model
  //           3) recent bar fallback
  const sessionLevels = useMemo(() => {
    if (!isOpen || !showSessionLevels || !primarySymbol || displaySpread || displayCompare) return undefined;

    const session = sessions[primarySymbol];
    const snapshot = snapshots[primarySymbol];
    const latestBar = entities[primarySymbol]?.latestBar;
    const lastPrice = latestBar?.close ?? null;

    // Helper: accept only positive finite numbers (backend defaults missing to 0)
    const validPrice = (v: unknown): number | null =>
      typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;

    // 1) Snapshot data from Massive
    if (snapshot) {
      const high = validPrice(snapshot.sessionHigh);
      const low = validPrice(snapshot.sessionLow);
      if (high !== null || low !== null) {
        return { high, low, last: lastPrice ?? validPrice(snapshot.sessionClose) };
      }
    }

    // 2) Session data from the backend's trading-session buckets
    if (session) {
      const high = validPrice(session.dayHigh);
      const low = validPrice(session.dayLow);
      if (high !== null || low !== null) {
        return { high, low, last: lastPrice };
      }
    }

    // 3) Bar fallback: scan only the last 24h of the primary chart data
    const symbolBars = chartSeriesBySymbol[primarySymbol] ?? [];
    if (symbolBars.length === 0) return undefined;

    const lastBarTime = normalizeTimestamp(
      latestBar?.startTime ?? symbolBars[symbolBars.length - 1]?.startTime
    );
    if (!Number.isFinite(lastBarTime)) return undefined;

    const sessionStart = lastBarTime - 24 * 60 * 60 * 1000;
    let high = -Infinity;
    let low = Infinity;

    for (const bar of symbolBars) {
      const barMs = normalizeTimestamp(bar.startTime);
      if (!Number.isFinite(barMs) || barMs < sessionStart) continue;
      if (bar.high > high) high = bar.high;
      if (bar.low < low) low = bar.low;
    }

    if (!Number.isFinite(high) || !Number.isFinite(low)) return undefined;

    return {
      high,
      low,
      last: lastPrice ?? symbolBars[symbolBars.length - 1]?.close ?? null,
    };
  }, [
    isOpen,
    showSessionLevels,
    primarySymbol,
    sessions,
    snapshots,
    entities,
    chartSeriesBySymbol,
    displaySpread,
    displayCompare,
  ]);

  // ── Header items ───────────────────────────────────────────────────────

  const headerItems = useMemo(() => {
    return headerSymbols.map((symbol) => {
      const symbolBars = resolvedSeriesBySymbol[symbol];
      const symbolEntity = entities[symbol];
      const symbolSnapshot = buildTickerSnapshot(
        symbol,
        symbolBars,
        symbolEntity?.latestBar,
        snapshots[symbol],
        sessions[symbol]
      );
      return {
        symbol,
        price: symbolSnapshot.last_price,
        changePercent: symbolSnapshot.changePercent,
      };
    });
  }, [headerSymbols, resolvedSeriesBySymbol, entities, snapshots, sessions]);

  // ── Overlay / comparison data ──────────────────────────────────────────

  const overlaySymbols = displaySpread
    ? showLegs
      ? spreadLegs.map((leg) => leg.symbol)
      : []
    : displayCompare
      ? comparisons
      : [];

  const comparisonData = useMemo(() => {
    const data: Record<string, LineData<Time>[]> = {};
    const symbols = new Set(overlaySymbols);
    for (const symbol of symbols) {
      const series = chartSeriesBySymbol[symbol];
      if (!series || series.length === 0) {
        data[symbol] = [];
        continue;
      }
      data[symbol] = toLineData(series);
    }
    return data;
  }, [overlaySymbols, chartSeriesBySymbol]);

  // ── Spread data ────────────────────────────────────────────────────────

  const spreadData = useMemo(() => {
    if (!spreadEnabled) return [];
    return buildSpreadSeries(spreadLegs, chartSeriesBySymbol);
  }, [spreadEnabled, spreadLegs, chartSeriesBySymbol]);

  // ── Live spread value (from latest bars) ────────────────────────────────

  const spreadValue = useMemo((): number | null => {
    if (!spreadEnabled || spreadLegs.length === 0) return null;
    let sum = 0;
    for (const leg of spreadLegs) {
      const entity = entities[leg.symbol];
      const latestClose = entity?.latestBar?.close;
      if (latestClose == null) return null; // missing leg data
      sum += latestClose * leg.weight;
    }
    return sum;
  }, [spreadEnabled, spreadLegs, entities]);

  // ── Chart config ───────────────────────────────────────────────────────

  const rangeKey = rangeOverride ? `${rangeOverride.start}:${rangeOverride.end}` : "default";
  const viewKey = displaySpread ? "spread" : displayCompare ? "compare" : "single";
  // NOTE: include viewKey so compare/spread switches re-fit the chart.
  // To disable that behavior, remove `:${viewKey}` from fitKey below.
  const fitKey = `${primarySymbol ?? "none"}:${timeframe}:${viewKey}:${rangeKey}`;
  const visibleBars = 100;
  const secondsVisible = timeframe.endsWith("s");

  return {
    chartData,
    primaryLineData,
    comparisonData,
    spreadData,
    spreadValue,
    bars,
    depthInfo,
    primarySnapshot,
    sessionLevels,
    headerItems,
    overlaySymbols,
    fitKey,
    visibleBars,
    secondsVisible,
    isHistoryReady: isOpen ? historyReady : false,
  };
}
