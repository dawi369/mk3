import type {
  PolygonWsRequest,
  PolygonAggregateEvent,
  PolygonQuoteEvent,
  PolygonTradeEvent,
  PolygonStatusMessage,
} from "@/utils/polygon_types.js";

import type { Bar } from "@/utils/general_types.js";

// Type guards for Polygon WebSocket messages
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

// Data transformations
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

export function toDate(epochMs: number): Date {
  return new Date(epochMs);
}

// WebSocket subscription helpers
// Returns comma-separated params like "A.ESZ5,A.NQZ5"
export function buildSubscribeParams(req: PolygonWsRequest): string {
  return req.symbols.map((s) => `${req.ev}.${s}`).join(",");
}
