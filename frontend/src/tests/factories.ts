import type { Bar } from "@/types/common.types";
import type { SessionData, SnapshotData } from "@/types/redis.types";

export function makeBar(overrides: Partial<Bar> = {}): Bar {
  return {
    symbol: "ESH6",
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume: 1000,
    trades: 10,
    startTime: 1_710_000_000_000,
    endTime: 1_710_000_060_000,
    ...overrides,
  };
}

export function makeSnapshot(
  overrides: Partial<SnapshotData> = {},
): SnapshotData {
  return {
    productCode: "ES",
    settlementDate: "2026-03-25",
    sessionOpen: 100,
    sessionHigh: 101,
    sessionLow: 99,
    sessionClose: 100.5,
    settlementPrice: 100,
    prevSettlement: 99.5,
    change: 1,
    changePct: 1,
    openInterest: 12345,
    timestamp: 1_710_000_000_000,
    ...overrides,
  };
}

export function makeSession(
  overrides: Partial<SessionData> = {},
): SessionData {
  return {
    sessionId: "2026-03-25",
    sessionStartTime: 1_710_000_000_000,
    sessionEndTime: 1_710_082_800_000,
    rootSymbol: "ES",
    timezone: "America/Chicago",
    dayOpen: 100,
    dayHigh: 101,
    dayLow: 99,
    vwap: 100.2,
    cvol: 1000,
    tradeCount: 10,
    volNow: 50,
    volMin: 10,
    volMax: 100,
    volPos: 0.5,
    volBucket: "mid",
    vwapMin: 99,
    vwapMax: 101,
    vwapPos: 0.5,
    vwapBucket: "mid",
    cumPriceVolume: 100_000,
    cumVolume: 1000,
    timestamp: 1_710_000_000_000,
    ...overrides,
  };
}
