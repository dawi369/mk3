import type { Bar } from "@/types/common.types";
import type { SnapshotData, SessionData } from "@/types/redis.types";
import type { TickerSnapshot } from "@/types/ticker.types";

function isValidPrice(value?: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isValidNumber(value?: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function summarizeBars(bars: Bar[]): {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
} {
  const open = bars[0].open;
  let high = bars[0].high;
  let low = bars[0].low;
  const close = bars[bars.length - 1].close;
  let volume = 0;
  let pv = 0;

  for (const bar of bars) {
    high = Math.max(high, bar.high);
    low = Math.min(low, bar.low);
    const v = bar.volume || 0;
    volume += v;
    pv += bar.close * v;
  }

  return {
    open,
    high,
    low,
    close,
    volume,
    vwap: volume > 0 ? pv / volume : undefined,
  };
}

export function resolveLastPrice(options: {
  bars?: Bar[];
  latest?: Bar;
  snapshot?: SnapshotData | null;
}): number | null {
  const { bars, latest, snapshot } = options;
  if (isValidPrice(latest?.close)) return latest!.close;
  if (bars && bars.length > 0 && isValidPrice(bars[bars.length - 1]?.close)) {
    return bars[bars.length - 1].close;
  }
  if (isValidPrice(snapshot?.sessionClose)) return snapshot!.sessionClose;
  if (isValidPrice(snapshot?.settlementPrice)) return snapshot!.settlementPrice;
  return null;
}

export function resolveReferencePrice(options: {
  bars?: Bar[];
  latest?: Bar;
  snapshot?: SnapshotData | null;
}): number | null {
  const { bars, latest, snapshot } = options;
  if (isValidPrice(snapshot?.prevSettlement)) return snapshot!.prevSettlement;
  if (isValidPrice(snapshot?.settlementPrice)) return snapshot!.settlementPrice;
  if (isValidPrice(snapshot?.sessionClose)) return snapshot!.sessionClose;
  if (bars && bars.length > 0 && isValidPrice(bars[0]?.open)) return bars[0].open;
  if (isValidPrice(latest?.open)) return latest!.open;
  return null;
}

export function getChangeMetrics(options: {
  bars?: Bar[];
  latest?: Bar;
  snapshot?: SnapshotData | null;
}): { change: number; changePercent: number; hasReference: boolean } {
  const lastPrice = resolveLastPrice(options);
  const reference = resolveReferencePrice(options);
  if (!isValidPrice(lastPrice) || !isValidPrice(reference)) {
    return { change: 0, changePercent: 0, hasReference: false };
  }
  const change = lastPrice - reference;
  const changePercent = reference === 0 ? 0 : (change / reference) * 100;
  return { change, changePercent, hasReference: true };
}

export function buildTickerSnapshot(
  symbol: string,
  bars?: Bar[],
  latest?: Bar,
  snapshot?: SnapshotData | null,
  session?: SessionData | null,
): TickerSnapshot {
  const summary = bars && bars.length > 0 ? summarizeBars(bars) : null;
  const resolvedLastPrice = resolveLastPrice({ bars, latest, snapshot });
  const lastPrice = resolvedLastPrice ?? 0;
  const resolvedReference = resolveReferencePrice({ bars, latest, snapshot });
  const reference = resolvedReference ?? lastPrice;
  const hasData =
    resolvedLastPrice !== null ||
    resolvedReference !== null ||
    summary !== null ||
    snapshot != null ||
    session != null;

  const sessionOpen =
    (isValidPrice(session?.dayOpen) && session!.dayOpen) ||
    (isValidPrice(snapshot?.sessionOpen) && snapshot!.sessionOpen) ||
    (isValidPrice(summary?.open) && summary!.open) ||
    (isValidPrice(latest?.open) && latest!.open) ||
    lastPrice;

  const sessionHigh =
    (isValidPrice(session?.dayHigh) && session!.dayHigh) ||
    (isValidPrice(snapshot?.sessionHigh) && snapshot!.sessionHigh) ||
    (isValidPrice(summary?.high) && summary!.high) ||
    (isValidPrice(latest?.high) && latest!.high) ||
    lastPrice;

  const sessionLow =
    (isValidPrice(session?.dayLow) && session!.dayLow) ||
    (isValidPrice(snapshot?.sessionLow) && snapshot!.sessionLow) ||
    (isValidPrice(summary?.low) && summary!.low) ||
    (isValidPrice(latest?.low) && latest!.low) ||
    lastPrice;

  let cumVolume = 0;
  if (isValidNumber(session?.cvol)) {
    cumVolume = session!.cvol;
  } else if (isValidNumber(summary?.volume)) {
    cumVolume = summary!.volume;
  } else if (isValidNumber(latest?.volume)) {
    cumVolume = latest!.volume;
  }

  const vwap = isValidPrice(session?.vwap)
    ? session!.vwap
    : isValidPrice(summary?.vwap)
      ? summary!.vwap
      : undefined;

  const change = lastPrice - reference;
  const changePercent = reference ? (change / reference) * 100 : 0;

  return {
    symbol,
    hasData,
    last_price: lastPrice,
    session_open: sessionOpen,
    session_high: sessionHigh,
    session_low: sessionLow,
    prev_close: reference,
    cum_volume: cumVolume,
    vwap,
    change,
    changePercent,
  };
}
