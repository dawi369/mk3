/**
 * Technical trend types for contracts
 */
export type TechnicalTrend = "BULLISH" | "BEARISH" | "NEUTRAL";

/**
 * VWAP position relative to price
 */
export type VWAPPosition = "Above" | "Below" | "At";

/**
 * Technical Indicator data for a specific contract/timeframe
 */
export interface TechnicalIndicatorData {
  /** Full ticker symbol (e.g., "ESZ5") */
  ticker: string;
  /** Human-readable product name (e.g., "S&P 500") */
  name: string;
  /** Overall technical trend */
  trend: TechnicalTrend;
  /** Relative Strength Index (0-100) */
  rsi: number;
  /** Moving Average Convergence Divergence value */
  macd: number;
  /** Current price position relative to VWAP */
  vwap: VWAPPosition;
  /** Change in Open Interest (formatted string like "+3.6k") */
  oi: string;
  /** Multi-Timeframe Score (0-10) */
  mtf: number;
  /** Current price for reference */
  price?: number;
}

/**
 * Signals for a specific indicator
 */
export interface IndicatorSignal {
  label: string;
  value: string | number;
  status: "success" | "warning" | "error" | "neutral";
  description?: string;
}

/**
 * Overview statistics for indicators view
 */
export interface IndicatorOverview {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  avgRsi: number;
  topMtfProduct: string;
}
