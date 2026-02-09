export interface SessionData {
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  vwap: number;
  cvol: number;
  tradeCount: number;
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
