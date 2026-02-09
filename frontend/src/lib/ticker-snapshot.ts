import type { Bar } from "@/types/common.types";
import type { SnapshotData, SessionData } from "@/types/redis.types";
import type { TickerSnapshot } from "@/types/ticker.types";

const MOCK_SYMBOLS = [
  "ESH6", "ESM6", "NQH6", "NQM6", "CLG6", "CLH6",
  "GCJ6", "GCM6", "SIH6", "SIK6", "ZBH6", "ZNH6",
  "ZCH6", "ZSH6", "ZWH6", "NGF6", "NGG6", "HGH6",
];

let mockIndex = 0;

function isValidPrice(value?: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isValidNumber(value?: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hashSymbol(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  let value = seed % 233280;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function summarizeBars(bars: Bar[]): {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
} {
  let open = bars[0].open;
  let high = bars[0].high;
  let low = bars[0].low;
  let close = bars[bars.length - 1].close;
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
  const lastPrice = resolveLastPrice({ bars, latest, snapshot }) ?? 0;
  const reference = resolveReferencePrice({ bars, latest, snapshot }) ?? lastPrice;

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

  if (lastPrice === 0 && !summary && !snapshot && !session) {
    return generateMockSnapshot(symbol);
  }

  return {
    symbol,
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

export function generateMockSnapshot(symbol?: string): TickerSnapshot {
  const sym = symbol || MOCK_SYMBOLS[mockIndex++ % MOCK_SYMBOLS.length];
  const rand = seededRandom(hashSymbol(sym));

  const basePrices: Record<string, number> = {
    ES: 52000,
    NQ: 18500,
    CL: 72,
    GC: 2050,
    SI: 24,
    ZB: 118,
    ZN: 110,
    ZC: 450,
    ZS: 1200,
    ZW: 580,
    NG: 2.8,
    HG: 385,
  };

  const root = sym.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, "");
  const basePrice = basePrices[root] || 1000;

  const variance = basePrice * 0.015;
  const prevClose = basePrice + (rand() - 0.5) * variance;
  const sessionOpen = prevClose + (rand() - 0.5) * variance * 0.3;
  const lastPrice = sessionOpen + (rand() - 0.5) * variance * 0.8;
  const sessionHigh = Math.max(sessionOpen, lastPrice) + rand() * variance * 0.2;
  const sessionLow = Math.min(sessionOpen, lastPrice) - rand() * variance * 0.2;

  return {
    symbol: sym,
    last_price: lastPrice,
    session_open: sessionOpen,
    session_high: sessionHigh,
    session_low: sessionLow,
    prev_close: prevClose,
    cum_volume: Math.floor(rand() * 1_500_000) + 50_000,
    vwap: (sessionHigh + sessionLow + lastPrice) / 3,
    change: lastPrice - prevClose,
    changePercent: prevClose ? ((lastPrice - prevClose) / prevClose) * 100 : 0,
  };
}
