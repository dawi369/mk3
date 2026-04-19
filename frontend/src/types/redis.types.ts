export type IndicatorBucket = "low" | "mid" | "high";

export interface SessionData {
  sessionId?: string;
  sessionStartTime?: number;
  sessionEndTime?: number;
  rootSymbol?: string;
  timezone?: string;
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
  cumPriceVolume: number;
  cumVolume: number;
  timestamp: number;
}

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
