import type { MassiveWsRequest, MassiveAggregateEvent, MassiveQuoteEvent, MassiveTradeEvent, MassiveStatusMessage } from "@/types/massive.types.js";

import type { Bar } from "@/types/common.types.js";

// Type guards for Massive WebSocket messages
export function isStatusMessage(m: unknown): m is MassiveStatusMessage {
  return !!m && typeof m === "object" && (m as any).ev === "status";
}

export function isAggregateEvent(m: unknown): m is MassiveAggregateEvent {
  return !!m && typeof m === "object" && (m as any).ev === "A";
}

export function isQuoteEvent(m: unknown): m is MassiveQuoteEvent {
  return !!m && typeof m === "object" && (m as any).ev === "Q";
}

export function isTradeEvent(m: unknown): m is MassiveTradeEvent {
  return !!m && typeof m === "object" && (m as any).ev === "T";
}

// Data transformations
export function aggregateToBar(a: MassiveAggregateEvent): Bar {
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
export function buildSubscribeParams(req: MassiveWsRequest): string {
  return req.symbols.map((s) => `${req.ev}.${s}`).join(",");
}

export function isMarketHours(): { isOpen: boolean; reason?: string } {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const hour = et.getHours();

  // Weekend
  if (day === 0 || day === 6) {
    return { isOpen: false, reason: "Weekend" };
  }

  // Daily futures reset: 5pm-6pm ET (no trading)
  if (hour === 17) {
    return { isOpen: false, reason: "Daily settlement period (5pm-6pm ET)" };
  }

  return { isOpen: true };
}
