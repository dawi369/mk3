export interface AssetStats {
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
}

export interface MarketMover {
  ticker: string;
  change: number;
  price: number;
  stats: AssetStats;
  sparklineData: number[];
}

export interface AssetClassData {
  id: string;
  title: string;
  activeMonth: string;
  nextMonth: string;
  winners: MarketMover[];
  losers: MarketMover[];
  rvol: number; // Relative Volume (e.g., 1.2 = 120% of average)
  sentiment: number; // 0-100 (50 neutral, >50 bullish, <50 bearish)
  avgChange: number; // Average percentage change of the sector
}

const generateSparklineData = (basePrice: number, points: number = 50): number[] => {
  let currentPrice = basePrice;
  const data = [];
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * (basePrice * 0.002); // Small random moves
    currentPrice += change;
    data.push(currentPrice);
  }
  return data;
};

const generateStats = (price: number): AssetStats => ({
  open: price * (1 + (Math.random() * 0.02 - 0.01)),
  high: price * (1 + Math.random() * 0.01),
  low: price * (1 - Math.random() * 0.01),
  prevClose: price * (1 + (Math.random() * 0.02 - 0.01)),
  volume: Math.floor(Math.random() * 1000000) + 50000,
});

export const mockTerminalData: AssetClassData[] = [
  {
    id: "indices",
    title: "US Indices",
    activeMonth: "DEC 25",
    nextMonth: "MAR 26",
    rvol: 1.45,
    sentiment: 65,
    avgChange: 0.85,
    winners: [
      {
        ticker: "YMZ5",
        change: 0.15,
        price: 35920.0,
        stats: generateStats(35920.0),
        sparklineData: generateSparklineData(35920.0),
      },
      {
        ticker: "RTYZ5",
        change: 0.1,
        price: 1819.9,
        stats: generateStats(1819.9),
        sparklineData: generateSparklineData(1819.9),
      },
      {
        ticker: "NQZ5",
        change: 0.06,
        price: 15490.0,
        stats: generateStats(15490.0),
        sparklineData: generateSparklineData(15490.0),
      },
    ],
    losers: [
      {
        ticker: "ESZ5",
        change: -0.07,
        price: 4504.5,
        stats: generateStats(4504.5),
        sparklineData: generateSparklineData(4504.5),
      },
      {
        ticker: "MESZ5",
        change: -0.02,
        price: 4395.0,
        stats: generateStats(4395.0),
        sparklineData: generateSparklineData(4395.0),
      },
      {
        ticker: "VIX",
        change: -1.5,
        price: 13.5,
        stats: generateStats(13.5),
        sparklineData: generateSparklineData(13.5),
      },
    ],
  },
  {
    id: "metals",
    title: "Metals",
    activeMonth: "DEC 25",
    nextMonth: "FEB 26",
    rvol: 0.85,
    sentiment: 55,
    avgChange: 0.12,
    winners: [
      {
        ticker: "GCZ5",
        change: 1.1,
        price: 2001.5,
        stats: generateStats(2001.5),
        sparklineData: generateSparklineData(2001.5),
      },
      {
        ticker: "SIZ5",
        change: 0.95,
        price: 24.5,
        stats: generateStats(24.5),
        sparklineData: generateSparklineData(24.5),
      },
      {
        ticker: "HGZ5",
        change: 0.5,
        price: 3.85,
        stats: generateStats(3.85),
        sparklineData: generateSparklineData(3.85),
      },
    ],
    losers: [
      {
        ticker: "PLZ5",
        change: -0.2,
        price: 950.0,
        stats: generateStats(950.0),
        sparklineData: generateSparklineData(950.0),
      },
      {
        ticker: "PAZ5",
        change: -0.5,
        price: 1050.0,
        stats: generateStats(1050.0),
        sparklineData: generateSparklineData(1050.0),
      },
      {
        ticker: "GCF6",
        change: -0.1,
        price: 2015.0,
        stats: generateStats(2015.0),
        sparklineData: generateSparklineData(2015.0),
      },
    ],
  },
  {
    id: "grains",
    title: "Grains",
    activeMonth: "DEC 25",
    nextMonth: "MAR 26",
    rvol: 0.6,
    sentiment: 40,
    avgChange: -0.3,
    winners: [
      {
        ticker: "ZCZ5",
        change: 1.5,
        price: 492.0,
        stats: generateStats(492.0),
        sparklineData: generateSparklineData(492.0),
      },
      {
        ticker: "ZWZ5",
        change: 1.1,
        price: 580.5,
        stats: generateStats(580.5),
        sparklineData: generateSparklineData(580.5),
      },
      {
        ticker: "ZSZ5",
        change: 0.8,
        price: 1350.25,
        stats: generateStats(1350.25),
        sparklineData: generateSparklineData(1350.25),
      },
    ],
    losers: [
      {
        ticker: "ZLZ5",
        change: -0.5,
        price: 55.2,
        stats: generateStats(55.2),
        sparklineData: generateSparklineData(55.2),
      },
      {
        ticker: "ZMZ5",
        change: -0.2,
        price: 410.0,
        stats: generateStats(410.0),
        sparklineData: generateSparklineData(410.0),
      },
      {
        ticker: "ZCH6",
        change: -0.1,
        price: 500.0,
        stats: generateStats(500.0),
        sparklineData: generateSparklineData(500.0),
      },
    ],
  },
  {
    id: "currencies",
    title: "Currencies",
    activeMonth: "DEC 25",
    nextMonth: "MAR 26",
    rvol: 1.05,
    sentiment: 48,
    avgChange: 0.05,
    winners: [
      {
        ticker: "6EZ5",
        change: 0.45,
        price: 1.091,
        stats: generateStats(1.091),
        sparklineData: generateSparklineData(1.091),
      },
      {
        ticker: "6BZ5",
        change: 0.3,
        price: 1.255,
        stats: generateStats(1.255),
        sparklineData: generateSparklineData(1.255),
      },
      {
        ticker: "6AZ5",
        change: 0.2,
        price: 0.655,
        stats: generateStats(0.655),
        sparklineData: generateSparklineData(0.655),
      },
    ],
    losers: [
      {
        ticker: "6JZ5",
        change: -0.6,
        price: 0.0068,
        stats: generateStats(0.0068),
        sparklineData: generateSparklineData(0.0068),
      },
      {
        ticker: "6CZ5",
        change: -0.15,
        price: 0.732,
        stats: generateStats(0.732),
        sparklineData: generateSparklineData(0.732),
      },
      {
        ticker: "DXZ5",
        change: -0.4,
        price: 103.5,
        stats: generateStats(103.5),
        sparklineData: generateSparklineData(103.5),
      },
    ],
  },
  {
    id: "volatiles",
    title: "Volatiles",
    activeMonth: "DEC 25",
    nextMonth: "JAN 26",
    rvol: 3.5,
    sentiment: 20,
    avgChange: 2.1,
    winners: [
      {
        ticker: "VIX",
        change: 5.2,
        price: 15.1,
        stats: generateStats(15.1),
        sparklineData: generateSparklineData(15.1),
      },
      {
        ticker: "KCZ5",
        change: 2.1,
        price: 165.5,
        stats: generateStats(165.5),
        sparklineData: generateSparklineData(165.5),
      },
      {
        ticker: "SBZ5",
        change: 1.5,
        price: 24.2,
        stats: generateStats(24.2),
        sparklineData: generateSparklineData(24.2),
      },
    ],
    losers: [
      {
        ticker: "CTZ5",
        change: -1.2,
        price: 82.5,
        stats: generateStats(82.5),
        sparklineData: generateSparklineData(82.5),
      },
      {
        ticker: "CCZ5",
        change: -0.8,
        price: 3500.0,
        stats: generateStats(3500.0),
        sparklineData: generateSparklineData(3500.0),
      },
      {
        ticker: "OJZ5",
        change: -0.5,
        price: 150.0,
        stats: generateStats(150.0),
        sparklineData: generateSparklineData(150.0),
      },
    ],
  },
];
