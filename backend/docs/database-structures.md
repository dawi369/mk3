# Data Structures

Canonical payload shapes used by the backend today.

## Bar

```ts
interface Bar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  dollarVolume?: number;
  startTime: number;
  endTime: number;
}
```

## Snapshot

```ts
interface SnapshotData {
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
```

## Session Metrics

```ts
type IndicatorBucket = "low" | "mid" | "high";

interface SessionData {
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
```

## Active Contracts

```ts
interface ActiveContract {
  ticker: string;
  productCode: string;
  lastTradeDate: string;
  active: boolean;
}

interface StoredActiveContracts {
  productCode: string;
  updatedAt: number;
  contracts: ActiveContract[];
}
```

## Front Month

```ts
interface FrontMonthInfo {
  frontMonth: string;
  productCode: string;
  assetClass: PolygonAssetClass;
  volume: number;
  daysToExpiry: number;
  nearestExpiry: string;
  isRolling: boolean;
  lastPrice: number | null;
  expiryDate: string;
  confidence: "low" | "medium" | "high";
  candidateCount: number;
}
```

## Current Persistence Model

- Redis is the only required store in the active runtime.
- TimescaleDB remains a deferred historical-store abstraction.
- Time-series bars in Redis are retained for 7 days.
- Active-contract cache and front-month cache survive daily clears.

Historical persistence and derived long-window analytics are tracked in [concerns/historical-data.md](./concerns/historical-data.md).
