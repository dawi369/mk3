# MK3 Backend - System Overview

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    POLYGON.IO (WebSocket API)               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     HUB SERVER (Bun)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Polygon WS Client                                    │  │
│  │  - Self-healing with exponential backoff              │  │
│  │  - Dynamic contract subscriptions                     │  │
│  │  - 6 asset classes: indices, metals, currencies,      │  │
│  │    grains, softs, volatiles                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                             │                               │
│        ┌────────────────────┼────────────────────┐          │
│        ▼                    ▼                    ▼          │
│  ┌──────────┐        ┌──────────┐        ┌──────────────┐   │
│  │  Redis   │        │TimescaleDB│       │  REST API    │   │
│  │  Stream  │        │  (hist)   │       │  :3001       │   │
│  └──────────┘        └──────────┘        └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                      Redis Stream
                    (market_data)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐
     │    Frontend     │           │  Workers (ML)   │
     │   (WebSocket)   │           │  (Backtesting)  │
     └─────────────────┘           └─────────────────┘
```

## Data Flow

```
Polygon WS → ws_client.ts (normalize + validate)
                │
                ├─→ Redis (bar:latest, bar:today:*, market_data stream)
                └─→ TimescaleDB (historical storage)
```

## Components

### Polygon WS Client (`src/server/api/polygon/ws_client.ts`)

- Connects to Polygon.io futures market
- Auto-reconnect with exponential backoff (500ms → 20s)
- Dynamic subscribe/unsubscribe

### Redis Store (`src/server/data/redis_store.ts`)

- `bar:latest` - HASH with latest bar per symbol
- `bar:today:{symbol}` - LIST with today's bars
- `market_data` - STREAM for real-time consumers

### TimescaleDB Store (`src/server/data/timescale_store.ts`)

- Hypertable for historical bar storage
- Index on (symbol, timestamp DESC)

### Contract Builders (`src/utils/cbs/`)

- `schedule_cb.ts` - Main scheduler for building requests
- Uses Polygon API to fetch active contracts
- Supports quarterly and monthly cycles

### Jobs (`src/jobs/`)

| Job | File | Schedule |
|-----|------|----------|
| Daily Clear | `clear_daily.ts` | 2 AM ET |
| Subscription Refresh | `refresh_subscriptions.ts` | 1st @ 00:05 ET |
| Front Month Detection | `front_month_job.ts` | 3 AM ET |

## File Structure

```
backend/
├── src/
│   ├── server/
│   │   ├── api/
│   │   │   ├── polygon/ws_client.ts  # Polygon WS client
│   │   │   └── rest_client.ts        # REST API
│   │   ├── data/
│   │   │   ├── redis_store.ts        # Redis operations
│   │   │   └── timescale_store.ts    # TimescaleDB operations
│   │   └── index.ts                  # Hub entrypoint
│   ├── config/
│   │   ├── env.ts                    # Environment variables
│   │   ├── limits.ts                 # System limits
│   │   └── subscriptions.ts          # Contract counts
│   ├── jobs/
│   │   ├── clear_daily.ts
│   │   ├── refresh_subscriptions.ts
│   │   └── front_month_job.ts
│   ├── utils/
│   │   └── cbs/schedule_cb.ts        # Contract scheduler
│   └── types/                        # TypeScript types
├── docs/                             # Documentation
├── tickers/                          # Ticker metadata (JSON)
└── dev_scripts/                      # Development utilities
```

## Current Subscriptions

Built dynamically using Polygon API:

| Asset Class | Type | Products |
|-------------|------|----------|
| US Indices | Quarterly | ES, NQ, YM, RTY |
| Metals | Quarterly | GC, SI, HG, PL, PA, MGC |
| Currencies | Quarterly | 6E, 6J, 6B, 6C, 6A, 6S |
| Grains | Monthly | ZC, ZW, ZS, ZM, ZL |
| Softs | Monthly | KC, CT, SB, CC, OJ, TT |
| Volatiles | Monthly | VX |

## Configuration

### `src/config/subscriptions.ts`

```typescript
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 1,  // Change to 2 for roll coverage
  METALS_QUARTERS: 1,
  CURRENCY_QUARTERS: 1,
  GRAINS_MONTHS: 1,
  SOFTS_MONTHS: 1,
  VOLATILES_MONTHS: 1,
} as const;
```

### `src/config/limits.ts`

```typescript
export const LIMITS = {
  maxHubBars: 86_400,        // Max bars in Redis List per symbol
  redisScanBatchSize: 100,
  redisDeleteBatchSize: 100,
  maxStreamLength: 10_000_000,
};
```
