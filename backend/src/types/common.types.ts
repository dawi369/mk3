import type { PolygonAssetClass } from "@/types/polygon.types.js";

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

export interface RefreshDetails {
  assetClass: PolygonAssetClass;
  eventType: "A" | "AM";
  oldSymbols: string[];
  newSymbols: string[];
  changed: boolean;
  success: boolean;
  error?: string;
}

export interface RefreshJobStatus {
  lastRunTime: number | null;
  lastSuccess: boolean;
  lastError: string | null;
  lastRefreshDetails: RefreshDetails[];
  totalRuns: number;
}

/**
 * Rolling intraday session calculations
 * Stored in Redis at session:{symbol}
 */
export type IndicatorBucket = "low" | "mid" | "high";

export interface SessionData {
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  vwap: number;
  cvol: number;
  tradeCount: number;
  volNow: number;
  volMin: number;
  volMax: number;
  volPos: number;
  volBucket: IndicatorBucket;
  vwapMin: number;
  vwapMax: number;
  vwapPos: number;
  vwapBucket: IndicatorBucket;
  // Internal running totals for VWAP calculation
  cumPriceVolume: number;
  cumVolume: number;
  timestamp: number;
}

/**
 * Exchange session snapshot from Polygon REST API
 * Stored in Redis at snapshot:{symbol}
 */
export interface SnapshotData {
  productCode: string;
  settlementDate: string;
  sessionOpen: number;
  sessionHigh: number;
  sessionLow: number;
  sessionClose: number;
  settlementPrice: number;
  prevSettlement: number;
  change: number;
  changePct: number;
  openInterest: number | null;
  timestamp: number;
}
