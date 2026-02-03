import type { Bar } from "@/types/common.types";
import type { TickerSnapshot } from "@/types/ticker.types";

const MOCK_SYMBOLS = [
  "ESH6", "ESM6", "NQH6", "NQM6", "CLG6", "CLH6",
  "GCJ6", "GCM6", "SIH6", "SIK6", "ZBH6", "ZNH6",
  "ZCH6", "ZSH6", "ZWH6", "NGF6", "NGG6", "HGH6",
];

let mockIndex = 0;

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

export function buildTickerSnapshot(symbol: string, bars?: Bar[], latest?: Bar): TickerSnapshot {
  if (bars && bars.length > 0) {
    const summary = summarizeBars(bars);
    return {
      symbol,
      last_price: summary.close,
      session_open: summary.open,
      session_high: summary.high,
      session_low: summary.low,
      prev_close: summary.open,
      cum_volume: summary.volume,
      vwap: summary.vwap,
    };
  }

  if (latest) {
    return {
      symbol,
      last_price: latest.close,
      session_open: latest.open,
      session_high: latest.high,
      session_low: latest.low,
      prev_close: latest.open,
      cum_volume: latest.volume,
      vwap: undefined,
    };
  }

  return generateMockSnapshot(symbol);
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
  };
}
