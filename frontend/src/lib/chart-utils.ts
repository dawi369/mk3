import type { Bar } from "@/types/common.types";
import type { CandlestickData, LineData, Time } from "lightweight-charts";
import type { SpreadLeg, Timeframe } from "@/types/ticker.types";

// ── Constants ────────────────────────────────────────────────────────────────

export type SpreadPresetId = "calendar" | "ratio" | "butterfly" | "condor";

export const SPREAD_PRESETS: Array<{ id: SpreadPresetId; label: string; weights: number[] }> = [
  { id: "calendar", label: "Calendar (1:-1)", weights: [1, -1] },
  { id: "ratio", label: "Ratio (1:-1)", weights: [1, -1] },
  { id: "butterfly", label: "Butterfly (1:-2:1)", weights: [1, -2, 1] },
  { id: "condor", label: "Condor (1:-1:-1:1)", weights: [1, -1, -1, 1] },
];

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  "15s": 15000,
  "30s": 30000,
  "1m": 60000,
  "5m": 300000,
  "15m": 900000,
  "30m": 1800000,
  "1h": 3600000,
  "2h": 7200000,
  "4h": 14400000,
  "1d": 86400000,
};

export type RangePresetId = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD";

export const RANGE_PRESETS: Array<{
  id: RangePresetId;
  label: string;
  timeframe: Timeframe;
  rangeMs?: number;
}> = [
  { id: "1D", label: "1D", timeframe: "1m", rangeMs: 24 * 60 * 60 * 1000 },
  { id: "5D", label: "5D", timeframe: "5m", rangeMs: 5 * 24 * 60 * 60 * 1000 },
  { id: "1M", label: "1M", timeframe: "30m", rangeMs: 30 * 24 * 60 * 60 * 1000 },
  { id: "3M", label: "3M", timeframe: "1h", rangeMs: 90 * 24 * 60 * 60 * 1000 },
  { id: "6M", label: "6M", timeframe: "2h", rangeMs: 180 * 24 * 60 * 60 * 1000 },
  { id: "YTD", label: "YTD", timeframe: "1d" },
];

// ── Pure Helpers ─────────────────────────────────────────────────────────────

export function normalizeTimestamp(value: number): number {
  if (!Number.isFinite(value)) return value;
  return value < 1e12 ? value * 1000 : value;
}

export function inferIntervalMs(bars: Bar[]): number | null {
  if (!bars || bars.length < 2) return null;
  const slice = bars.length > 60 ? bars.slice(-60) : bars;
  const times = slice
    .map((bar) => normalizeTimestamp(bar.startTime))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (times.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const diff = times[i] - times[i - 1];
    if (diff > 0) diffs.push(diff);
  }

  if (diffs.length === 0) return null;
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)] ?? null;
}

export function mergeLatestIntoSeries(series: Bar[], latest: Bar | undefined, bucketMs: number): Bar[] {
  if (!latest) return series;
  const normalizedStart = normalizeTimestamp(latest.startTime);
  if (!Number.isFinite(normalizedStart)) return series;
  const bucketStart = Math.floor(normalizedStart / bucketMs) * bucketMs;
  const bucketEnd = bucketStart + bucketMs;
  const existing = series.length > 0 ? [...series] : [];
  const last = existing[existing.length - 1];
  if (!last) {
    existing.push({
      ...latest,
      startTime: bucketStart,
      endTime: bucketEnd,
    });
    return existing;
  }

  const lastStart = normalizeTimestamp(last.startTime);
  if (lastStart === bucketStart) {
    if (
      last.close === latest.close &&
      last.high >= latest.high &&
      last.low <= latest.low
    ) {
      return existing;
    }
    existing[existing.length - 1] = {
      ...last,
      high: Math.max(last.high, latest.high),
      low: Math.min(last.low, latest.low),
      close: latest.close,
      volume: (last.volume || 0) + (latest.volume || 0),
      trades: (last.trades || 0) + (latest.trades || 0),
      endTime: bucketEnd,
    };
    return existing;
  }

  if (bucketStart > lastStart) {
    existing.push({
      ...latest,
      startTime: bucketStart,
      endTime: bucketEnd,
    });
  }

  return existing;
}

export function formatDepth(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

export const formatNumber = (num: number, decimals = 2) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

export function toCandleData(bars: Bar[]): CandlestickData<Time>[] {
  return bars.map((bar) => ({
    time: Math.floor(normalizeTimestamp(bar.startTime) / 1000) as Time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  }));
}

export function toLineData(bars: Bar[]): LineData<Time>[] {
  return bars.map((bar) => ({
    time: Math.floor(normalizeTimestamp(bar.startTime) / 1000) as Time,
    value: bar.close,
  }));
}

export function buildSpreadSeries(
  legs: SpreadLeg[],
  seriesBySymbol: Record<string, Bar[]>
): LineData<Time>[] {
  if (!legs || legs.length === 0) return [];

  const legMaps = legs.map((leg) => {
    const bars = seriesBySymbol[leg.symbol];
    if (!bars || bars.length === 0) return { leg, map: new Map<number, number>() };
    const map = new Map<number, number>();
    for (const bar of bars) {
      map.set(normalizeTimestamp(bar.startTime), bar.close);
    }
    return { leg, map };
  });

  const base = legMaps[0];
  const data: LineData<Time>[] = [];

  for (const [time, baseValue] of base.map) {
    let sum = baseValue * base.leg.weight;
    let valid = true;

    for (let i = 1; i < legMaps.length; i++) {
      const nextValue = legMaps[i].map.get(time);
      if (nextValue === undefined) {
        valid = false;
        break;
      }
      sum += nextValue * legMaps[i].leg.weight;
    }

    if (valid) {
      data.push({
        time: Math.floor(time / 1000) as Time,
        value: sum,
      });
    }
  }

  return data;
}

export function reorderSymbols(order: string[], from: string, to: string): string[] {
  if (from === to) return order;
  if (!order.includes(from)) return order;
  const next = order.filter((symbol) => symbol !== from);
  const targetIndex = next.indexOf(to);
  if (targetIndex === -1) {
    next.push(from);
    return next;
  }
  next.splice(targetIndex, 0, from);
  return next;
}
