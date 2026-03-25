// Types for Massive realtime messages and normalized shapes for a futures dashboard

// Massive WebSocket protocol types

// Health status type
export interface WSHealth {
  connected: boolean;
  lastMessageTime: number | null;
  subscriptionCount: number;
  latencyMs: number | null;
}

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  SUBSCRIBED = "subscribed",
  RECONNECTING = "reconnecting",
}

export type MassiveMarketType = "futures";

export type MassiveAssetClass = "us_indices" | "metals" | "currencies" | "grains" | "softs" | "volatiles";

export type MarketStatus = "open" | "closed" | "pre" | "post" | "halted";

export interface MassiveWsRequest {
  ev: "AM" | "A";
  symbols: string[];
  assetClass?: MassiveAssetClass;
}

export interface MassiveSubscribeMessage {
  action: "subscribe";
  params: string; // e.g. "A.ESZ5,Q.ESZ5"
}

export interface MassiveStatusMessage {
  ev: "status";
  status: "connected" | "auth_success" | "auth_failed" | string;
  message?: string;
}

export interface MassiveAggregateEvent {
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

export interface MassiveQuoteEvent {
  ev: "Q";
  sym: string;
  bp: number; // best bid price
  bs: number; // best bid size
  ap: number; // best ask price
  as: number; // best ask size
  t: number; // timestamp (ms)
}

export interface MassiveTradeEvent {
  ev: "T";
  sym: string;
  p: number; // price
  s: number; // size
  t: number; // timestamp (ms)
}

export type MassiveRealtimeMessage = MassiveStatusMessage | MassiveAggregateEvent | MassiveQuoteEvent | MassiveTradeEvent;
