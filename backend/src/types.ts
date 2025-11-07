// Types for Polygon realtime messages and normalized shapes for a futures dashboard

export interface PolygonWsRequest {
  ev: "AM" | "A";
  symbols: string[];
}

export function buildSubscribeParams(req: PolygonWsRequest): string {
  return req.symbols.map((s) => `${req.ev}.${s}`).join(",");
}

// Polygon status message (sent on connect/auth)
export interface PolygonStatusMessage {
  ev: "status";
  status: "connected" | "auth_success" | "auth_failed" | string;
  message?: string;
}

// Polygon aggregate (bar) message
export interface PolygonAggregateEvent {
  ev: "A"; // aggregate event
  sym: string; // symbol, e.g. ESZ5
  v: number; // volume
  dv: number; // dollar volume
  n: number; // number of trades
  o: number; // open
  c: number; // close
  h: number; // high
  l: number; // low
  s: number; // start timestamp (ms)
  e: number; // end timestamp (ms)
}

// Polygon quote message (top of book)
export interface PolygonQuoteEvent {
  ev: "Q";
  sym: string; // symbol
  bp: number; // best bid price
  bs: number; // best bid size
  ap: number; // best ask price
  as: number; // best ask size
  t: number; // timestamp (ms)
}

// Polygon trade message (individual trade print)
export interface PolygonTradeEvent {
  ev: "T";
  sym: string; // symbol
  p: number; // price
  s: number; // size
  t: number; // timestamp (ms)
}

// Union of Polygon messages we care about
export type PolygonRealtimeMessage =
  | PolygonStatusMessage
  | PolygonAggregateEvent
  | PolygonQuoteEvent
  | PolygonTradeEvent;

// Normalized bar shape for the app
export interface Bar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  dollarVolume?: number;
  startTime: number; // ms since epoch
  endTime: number; // ms since epoch
}

// Lightweight instrument metadata for futures
export interface FuturesInstrument {
  symbol: string; // e.g. ESZ5
  root: string; // e.g. ES
  expiry: string; // YYYY-MM (approx) or broker format
  exchange?: string;
  tickSize?: number; // minimum price increment
  multiplier?: number; // dollar value per point
  currency?: string; // e.g. USD
}

// Basic market status useful for gating UI updates
export type MarketStatus = "open" | "closed" | "pre" | "post" | "halted";

export type PolygonMarketType = "futures" | "stocks" | "crypto"

// WebSocket subscribe message shape
export interface PolygonSubscribeMessage {
  action: "subscribe";
  params: string; // e.g. "A.ESZ5,Q.ESZ5"
}

// Helpers
export function toDate(epochMs: number): Date {
  return new Date(epochMs);
}

export function aggregateToBar(a: PolygonAggregateEvent): Bar {
  return {
    symbol: a.sym,
    open: a.o,
    high: a.h,
    low: a.l,
    close: a.c,
    volume: a.v,
    trades: a.n,
    dollarVolume: a.dv,
    startTime: a.s,
    endTime: a.e,
  };
}

export function isStatusMessage(m: unknown): m is PolygonStatusMessage {
  return !!m && typeof m === "object" && (m as any).ev === "status";
}

export function isAggregateEvent(m: unknown): m is PolygonAggregateEvent {
  return !!m && typeof m === "object" && (m as any).ev === "A";
}

export function isQuoteEvent(m: unknown): m is PolygonQuoteEvent {
  return !!m && typeof m === "object" && (m as any).ev === "Q";
}

export function isTradeEvent(m: unknown): m is PolygonTradeEvent {
  return !!m && typeof m === "object" && (m as any).ev === "T";
}
