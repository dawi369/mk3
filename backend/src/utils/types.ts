// Types for Polygon realtime messages and normalized shapes for a futures dashboard

// Polygon WebSocket protocol types

export interface PolygonWsRequest {
  ev: "AM" | "A";
  symbols: string[];
}

export interface PolygonSubscribeMessage {
  action: "subscribe";
  params: string; // e.g. "A.ESZ5,Q.ESZ5"
}

export interface PolygonStatusMessage {
  ev: "status";
  status: "connected" | "auth_success" | "auth_failed" | string;
  message?: string;
}

export interface PolygonAggregateEvent {
  ev: "A";
  sym: string; // e.g. ESZ5
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

export interface PolygonQuoteEvent {
  ev: "Q";
  sym: string;
  bp: number; // best bid price
  bs: number; // best bid size
  ap: number; // best ask price
  as: number; // best ask size
  t: number; // timestamp (ms)
}

export interface PolygonTradeEvent {
  ev: "T";
  sym: string;
  p: number; // price
  s: number; // size
  t: number; // timestamp (ms)
}

export type PolygonRealtimeMessage =
  | PolygonStatusMessage
  | PolygonAggregateEvent
  | PolygonQuoteEvent
  | PolygonTradeEvent;

// Application domain types

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

export interface FuturesInstrument {
  symbol: string; // e.g. ESZ5
  root: string; // e.g. ES
  expiry: string; // YYYY-MM (approx) or broker format
  exchange?: string;
  tickSize?: number; // minimum price increment
  multiplier?: number; // dollar value per point
  currency?: string; // e.g. USD
}

export type MarketStatus = "open" | "closed" | "pre" | "post" | "halted";

export type PolygonMarketType = "futures" | "stocks" | "crypto";

// Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
export type MonthCode =
  | "F"
  | "G"
  | "H"
  | "J"
  | "K"
  | "M"
  | "N"
  | "Q"
  | "U"
  | "V"
  | "X"
  | "Z";
