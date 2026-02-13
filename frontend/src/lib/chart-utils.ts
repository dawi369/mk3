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

  // Build sorted arrays for each leg (sorted by normalized timestamp)
  const legArrays = legs.map((leg) => {
    const bars = seriesBySymbol[leg.symbol];
    if (!bars || bars.length === 0) return { leg, times: [] as number[], closes: [] as number[] };
    const times: number[] = [];
    const closes: number[] = [];
    for (const bar of bars) {
      times.push(normalizeTimestamp(bar.startTime));
      closes.push(bar.close);
    }
    return { leg, times, closes };
  });

  const base = legArrays[0];
  if (base.times.length === 0) return [];

  // Infer bar interval from the base leg for tolerance calculation
  const intervalMs = base.times.length >= 2 ? base.times[1] - base.times[0] : 60_000;
  const tolerance = Math.max(intervalMs * 1.5, 2000); // At least 2s tolerance

  // Binary search: find nearest value in sorted array within tolerance
  const findNearest = (times: number[], closes: number[], target: number): number | null => {
    let lo = 0;
    let hi = times.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (times[mid] < target) lo = mid + 1;
      else if (times[mid] > target) hi = mid - 1;
      else return closes[mid]; // exact match
    }
    // Check the two candidates around the insertion point
    let bestIdx = -1;
    let bestDist = tolerance;
    if (hi >= 0 && Math.abs(times[hi] - target) < bestDist) {
      bestDist = Math.abs(times[hi] - target);
      bestIdx = hi;
    }
    if (lo < times.length && Math.abs(times[lo] - target) < bestDist) {
      bestIdx = lo;
    }
    return bestIdx >= 0 ? closes[bestIdx] : null;
  };

  const data: LineData<Time>[] = [];

  for (let b = 0; b < base.times.length; b++) {
    const time = base.times[b];
    let sum = base.closes[b] * base.leg.weight;
    let valid = true;

    for (let i = 1; i < legArrays.length; i++) {
      const value = findNearest(legArrays[i].times, legArrays[i].closes, time);
      if (value === null) {
        valid = false;
        break;
      }
      sum += value * legArrays[i].leg.weight;
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
