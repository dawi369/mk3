export interface TickerSearchResult {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  rank: number; // For sorting relevance
}

const MOCK_TICKERS: TickerSearchResult[] = [
  { symbol: "ES", name: "E-mini S&P 500", lastPrice: 5200.50, change: 12.50, changePercent: 0.24, volume: 1500000, rank: 1 },
  { symbol: "NQ", name: "E-mini Nasdaq-100", lastPrice: 18100.25, change: -45.00, changePercent: -0.25, volume: 800000, rank: 2 },
  { symbol: "RTY", name: "E-mini Russell 2000", lastPrice: 2050.10, change: 5.40, changePercent: 0.26, volume: 200000, rank: 3 },
  { symbol: "YM", name: "E-mini Dow Jones", lastPrice: 39500, change: 100, changePercent: 0.25, volume: 150000, rank: 4 },
  { symbol: "GC", name: "Gold", lastPrice: 2350.5, change: 15.2, changePercent: 0.65, volume: 250000, rank: 5 },
  { symbol: "CL", name: "Crude Oil", lastPrice: 85.20, change: -1.2, changePercent: -1.4, volume: 400000, rank: 6 },
  { symbol: "SI", name: "Silver", lastPrice: 28.50, change: 0.50, changePercent: 1.75, volume: 120000, rank: 7 },
  { symbol: "6E", name: "Euro FX", lastPrice: 1.0850, change: 0.0020, changePercent: 0.18, volume: 100000, rank: 8 },
  { symbol: "BTC", name: "Bitcoin Futures", lastPrice: 70500, change: 1200, changePercent: 1.73, volume: 50000, rank: 9 },
  { symbol: "ZC", name: "Corn", lastPrice: 450.25, change: -2.50, changePercent: -0.55, volume: 80000, rank: 10 },
];

export function searchTickers(query: string): TickerSearchResult[] {
  if (!query) return [];
  
  const q = query.toUpperCase();
  return MOCK_TICKERS.filter(ticker => 
    ticker.symbol.startsWith(q) || ticker.symbol.includes(q) || ticker.name.toUpperCase().includes(q)
  ).sort((a, b) => {
    // Exact match sorting priority
    const aExact = a.symbol === q;
    const bExact = b.symbol === q;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Starts with priority
    const aStarts = a.symbol.startsWith(q);
    const bStarts = b.symbol.startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // Rank fallback
    return a.rank - b.rank;
  });
}

export function getTickerDetails(symbol: string): TickerSearchResult | undefined {
  return MOCK_TICKERS.find(t => t.symbol === symbol);
}
