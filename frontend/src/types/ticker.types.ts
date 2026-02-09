import type { Bar } from "@/types/common.types";
import type { AssetClassId, TickerConfig } from "@/lib/ticker-mapping";

export type TickerMode = "front" | "curve";

export type TickerAssetClass = AssetClassId | "unknown";

export interface TickerEntity {
  symbol: string;
  mode: TickerMode;
  productCode: string;
  assetClass: TickerAssetClass;
  name: string;
  metadata?: TickerConfig;
  latestBar?: Bar;
  lastUpdated?: number;
}

export interface TickerSnapshot {
  symbol: string;
  last_price: number;
  session_open: number;
  session_high: number;
  session_low: number;
  prev_close: number;
  cum_volume: number;
  vwap?: number;
  change: number;
  changePercent: number;
}

export interface TickerSelectionState {
  primary: string | null;
  selected: string[];
  spreadEnabled: boolean;
  spreadLegs: SpreadLeg[];
}

export interface SpreadLeg {
  symbol: string;
  weight: number;
}

export interface TickerSeries {
  symbol: string;
  mode: TickerMode;
  bars: Bar[];
}

export interface TickerSearchResult {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  rank: number;
}

export const TIMEFRAMES = ["5s", "30s", "1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const MAX_SPREAD_LEGS = 4;
