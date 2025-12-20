export interface SentimentAssetData {
  symbol: string;
  name: string;
  sentiment: number; // 0-100
  trend: "improving" | "deteriorating" | "stable";
  volumeWeight: number;
}

export interface SentimentTheme {
  id: string;
  title: string;
  category: "macro" | "technical" | "flow";
  impact: number; // -100 to 100
  status: "growing" | "fading" | "peak";
}

export const mockSentimentData = {
  macro: 64, // Overall market sentiment
  assets: [
    { symbol: "ES", name: "S&P 500", sentiment: 62, trend: "improving", volumeWeight: 0.85 },
    { symbol: "NQ", name: "Nasdaq 100", sentiment: 58, trend: "stable", volumeWeight: 0.92 },
    {
      symbol: "RTY",
      name: "Russell 2000",
      sentiment: 45,
      trend: "deteriorating",
      volumeWeight: 0.65,
    },
    { symbol: "CL", name: "Crude Oil", sentiment: 72, trend: "improving", volumeWeight: 0.78 },
    { symbol: "GC", name: "Gold", sentiment: 51, trend: "stable", volumeWeight: 0.55 },
    { symbol: "6E", name: "Euro", sentiment: 38, trend: "deteriorating", volumeWeight: 0.42 },
  ] as SentimentAssetData[],
  themes: [
    { id: "1", title: "Rate Cut Expectations", category: "macro", impact: 75, status: "growing" },
    { id: "2", title: "Tech Earnings Overhang", category: "macro", impact: -40, status: "fading" },
    {
      id: "3",
      title: "Gamma Exposure Reversal",
      category: "technical",
      impact: -60,
      status: "peak",
    },
    { id: "4", title: "Bond Yield Correlation", category: "macro", impact: 30, status: "growing" },
    { id: "5", title: "Retail FOMO Flow", category: "flow", impact: 85, status: "growing" },
  ] as SentimentTheme[],
};
