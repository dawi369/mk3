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

  const { seriesBySymbol: historySeriesBySymbol } = useChartHistory({
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

  const sessionLevels = useMemo(() => {
    if (!showSessionLevels || !primarySnapshot || displaySpread || displayCompare) return undefined;
    return {
      high: primarySnapshot.session_high,
      low: primarySnapshot.session_low,
      last: primarySnapshot.last_price,
    };
  }, [showSessionLevels, primarySnapshot, displaySpread, displayCompare]);

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

  // ── Chart config ───────────────────────────────────────────────────────

  const fitKey = `${primarySymbol ?? "none"}:${timeframe}:${displaySpread ? "spread" : displayCompare ? "compare" : "single"}`;
  const visibleBars = 100;
  const secondsVisible = timeframe.endsWith("s");

  return {
    chartData,
    primaryLineData,
    comparisonData,
    spreadData,
    bars,
    depthInfo,
    primarySnapshot,
    sessionLevels,
    headerItems,
    overlaySymbols,
    fitKey,
    visibleBars,
    secondsVisible,
  };
}
