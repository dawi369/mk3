export interface TechnicalLevels {
  r3: number;
  r2: number;
  r1: number;
  pivot: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface CuratedStrategy {
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: number; // 1-10
  title: string;
  description: string;
  entry: string;
  stop: string;
  target: string;
}

export interface IndicatorData {
  asset: string;
  trendStrength: number; // 0-100
  volatilityRegime: "COMPRESSING" | "EXPANDING" | "EXHAUSTED";
  volatilityValue: number;
  momentum: number; // -100 to 100
  levels: TechnicalLevels;
  strategy: CuratedStrategy;
}

export const mockIndicatorsData: Record<string, IndicatorData> = {
  ES: {
    asset: "ES",
    trendStrength: 78,
    volatilityRegime: "EXPANDING",
    volatilityValue: 18.5,
    momentum: 62,
    levels: {
      r3: 5120.5,
      r2: 5085.25,
      r1: 5042.0,
      pivot: 5012.75,
      s1: 4985.5,
      s2: 4950.25,
      s3: 4910.0,
    },
    strategy: {
      bias: "BULLISH",
      strength: 8,
      title: "Breakout Trend Following",
      description:
        "Strong momentum build-up above the pivot. Volatility is expanding, suggesting a trend continuation.",
      entry: "5045.00",
      stop: "5010.00",
      target: "5115.00",
    },
  },
  NQ: {
    asset: "NQ",
    trendStrength: 45,
    volatilityRegime: "COMPRESSING",
    volatilityValue: 12.2,
    momentum: -15,
    levels: {
      r3: 18200.0,
      r2: 18050.0,
      r1: 17920.0,
      pivot: 17850.0,
      s1: 17720.0,
      s2: 17580.0,
      s3: 17400.0,
    },
    strategy: {
      bias: "NEUTRAL",
      strength: 4,
      title: "Mean Reversion / Range Play",
      description:
        "Price is chopping around the pivot with low volatility. Avoid directional bets until a clear breakout.",
      entry: "17850.00",
      stop: "17700.00",
      target: "18000.00",
    },
  },
};
