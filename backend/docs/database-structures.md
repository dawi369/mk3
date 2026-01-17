# Database Structures

**Last Updated:** December 14, 2025

This document describes the current Redis and TimescaleDB data structures used by the MK3 backend.

---

## Table of Contents

1. [Redis](#redis)
   - [Real-Time Data Keys](#real-time-data-keys)
   - [Redis Stream](#redis-stream)
   - [Redis Pub/Sub](#redis-pubsub)
   - [Job Status Keys](#job-status-keys)
   - [Cache Keys](#cache-keys)
   - [Metadata Keys](#metadata-keys)
2. [TimescaleDB](#timescaledb)
   - [Schema](#schema)
   - [Indexes](#indexes)
   - [Data Types](#data-types)
3. [Data Flow](#data-flow)

---

## Redis

Redis is used for **real-time data**, **job status persistence**, and **caching**. It serves as the central event bus for clients and workers.

### Real-Time Data Keys

| Key Pattern          | Type | Purpose                            | TTL                      |
| -------------------- | ---- | ---------------------------------- | ------------------------ |
| `bar:latest`         | HASH | Latest bar (JSON) per symbol field | Cleared daily at 2 AM ET |
| `bar:today:{symbol}` | LIST | Today's bars (JSON) for a symbol   | Cleared daily at 2 AM ET |

**Hash Operations:**

```bash
# Set latest bar for a symbol
HSET bar:latest ESZ25 '{"symbol":"ESZ25",...}'

# Get latest bar for one symbol (O(1))
HGET bar:latest ESZ25

# Get all latest bars in one call (O(N), single round-trip)
HGETALL bar:latest

# Get list of symbols
HKEYS bar:latest

# Get symbol count
HLEN bar:latest
```

**Bar JSON Structure:**

```json
{
  "symbol": "ESZ25",
  "open": 5000.25,
  "high": 5001.5,
  "low": 4999.0,
  "close": 5000.75,
  "volume": 1234,
  "trades": 56,
  "dollarVolume": 6175000.5,
  "startTime": 1702560000000,
  "endTime": 1702560060000
}
```

**List Limits:**

- Max bars per symbol: `86,400` (configured in `LIMITS.maxHubBars`)
- Trimmed using `LTRIM` after each `RPUSH`

---

### Redis Stream

| Stream Name   | Purpose                                     | Max Length          |
| ------------- | ------------------------------------------- | ------------------- |
| `market_data` | Primary event bus for real-time market data | ~10,000,000 entries |

**Stream Entry Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `data` | STRING (JSON) | Serialized Bar object |

**Stream Operations:**

- **Write:** `XADD market_data MAXLEN ~ 10000000 * data <JSON>`
- **Read (Blocking):** `XREAD BLOCK 5000 STREAMS market_data $`
- **Read (History):** `XREVRANGE market_data + - COUNT 100`

**Consumer Pattern:**

```
Hub Server writes → market_data stream
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
   WebSocket Clients              Future Workers
   (XREAD BLOCK)                  (XREADGROUP)
```

---

### Redis Pub/Sub

| Channel | Purpose                         | Status                                            |
| ------- | ------------------------------- | ------------------------------------------------- |
| `bars`  | Legacy real-time bar broadcasts | ⚠️ Legacy (maintained for backward compatibility) |

> [!NOTE]
> The `bars` pub/sub channel is maintained for legacy Edge servers but new clients should use the `market_data` Redis Stream instead.

---

### Job Status Keys

| Key                       | Type          | Purpose                                 |
| ------------------------- | ------------- | --------------------------------------- |
| `job:clear:status`        | STRING (JSON) | Daily clear job status                  |
| `job:refresh:status`      | STRING (JSON) | Monthly subscription refresh job status |
| `job:front-months:status` | STRING (JSON) | Front month detection job status        |

**Clear Job Status Structure:**

```json
{
  "lastRunTime": 1702560000000,
  "lastSuccess": true,
  "lastError": null,
  "clearedKeys": 42,
  "totalRuns": 15
}
```

**Refresh Job Status Structure:**

```json
{
  "lastRunTime": 1702560000000,
  "lastSuccess": true,
  "lastError": null,
  "lastRefreshDetails": [
    {
      "assetClass": "us_indices",
      "eventType": "A",
      "oldSymbols": ["ESZ25", "NQZ25"],
      "newSymbols": ["ESH26", "NQH26"],
      "changed": true,
      "success": true
    }
  ],
  "totalRuns": 10
}
```

**Front Month Job Status Structure:**

```json
{
  "lastRunTime": 1702560000000,
  "lastSuccess": true,
  "lastError": null,
  "productsUpdated": 25,
  "totalRuns": 30
}
```

---

### Cache Keys

| Key Pattern                  | Type                 | Purpose                       | TTL               |
| ---------------------------- | -------------------- | ----------------------------- | ----------------- |
| `cache:front-months`         | STRING (JSON)        | Front month detection cache   | None (persistent) |
| `history:{symbol}:{YYYY-MM}` | STRING (Base64 Gzip) | Monthly historical data cache | None (persistent) |

**Front Month Cache Structure:**

```json
{
  "lastUpdated": 1702560000000,
  "products": {
    "ES": {
      "frontMonth": "ESZ25",
      "productCode": "ES",
      "assetClass": "us_indices",
      "volume": 1234567,
      "daysToExpiry": 15,
      "nearestExpiry": "ESZ25",
      "isRolling": false,
      "lastPrice": 5000.25,
      "expiryDate": "2025-12-20"
    }
  }
}
```

**History Cache:**

- Compressed with gzip and stored as Base64 string
- Monthly granularity (one key per symbol/month)
- Read-through caching: Redis → TimescaleDB query → Redis (if miss)

---

### Metadata Keys

| Key                 | Type             | Purpose                           |
| ------------------- | ---------------- | --------------------------------- |
| `meta:trading_date` | STRING           | Current trading date (YYYY-MM-DD) |
| `meta:bar_count`    | STRING (integer) | Total bars written today          |

---

## TimescaleDB

TimescaleDB (Postgres with time-series extensions) is used for **historical data storage**, **ML training datasets**, and **backtesting**.

### Schema

**Table: `bars`**

| Column      | Type             | Constraints | Description                             |
| ----------- | ---------------- | ----------- | --------------------------------------- |
| `symbol`    | TEXT             | NOT NULL    | Futures contract ticker (e.g., "ESZ25") |
| `open`      | DOUBLE PRECISION | NOT NULL    | Opening price                           |
| `high`      | DOUBLE PRECISION | NOT NULL    | High price                              |
| `low`       | DOUBLE PRECISION | NOT NULL    | Low price                               |
| `close`     | DOUBLE PRECISION | NOT NULL    | Closing price                           |
| `volume`    | DOUBLE PRECISION | NOT NULL    | Volume                                  |
| `vwap`      | DOUBLE PRECISION | NOT NULL    | Volume-weighted average price           |
| `timestamp` | TIMESTAMPTZ      | NOT NULL    | Bar timestamp                           |

**Constraints:**

- `UNIQUE (symbol, timestamp)` — Prevents duplicate bars

**Hypertable:**

- The `bars` table is converted to a TimescaleDB hypertable partitioned by `timestamp`

### Indexes

| Index Name             | Columns                    | Description                                  |
| ---------------------- | -------------------------- | -------------------------------------------- |
| `idx_bars_symbol_time` | `(symbol, timestamp DESC)` | Optimizes symbol-filtered time-range queries |

### Data Types

**Bar Insert Example:**

```sql
INSERT INTO bars (symbol, open, high, low, close, volume, vwap, timestamp)
VALUES ('ESZ25', 5000.25, 5001.50, 4999.00, 5000.75, 1234, 5000.50, '2025-12-14 10:00:00-05')
ON CONFLICT (symbol, timestamp) DO UPDATE SET
  open = EXCLUDED.open,
  high = EXCLUDED.high,
  low = EXCLUDED.low,
  close = EXCLUDED.close,
  volume = EXCLUDED.volume,
  vwap = EXCLUDED.vwap;
```

**Query Example (with caching):**

```sql
SELECT
  symbol,
  open, high, low, close, volume, vwap,
  extract(epoch from timestamp) * 1000 as timestamp
FROM bars
WHERE symbol = 'ESZ25'
AND timestamp >= '2025-12-01'
AND timestamp <= '2025-12-14'
ORDER BY timestamp ASC;
```

### VWAP Calculation

VWAP is calculated during insert:

```typescript
const vwap =
  bar.dollarVolume && bar.volume ? bar.dollarVolume / bar.volume : bar.close;
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Polygon.io WebSocket                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Hub Server (ws_client.ts)                    │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │  1. Receive aggregate event                             │  │
│    │  2. Validate with Zod schema                            │  │
│    │  3. Transform to Bar                                    │  │
│    └────────────────────┬───────────────────┬────────────────┘  │
│                         │                   │                   │
│           ┌─────────────┴───────┐   ┌───────┴─────────────┐     │
│           ▼                     │   ▼                     │     │
│    ┌─────────────────┐          │   ┌─────────────────┐   │     │
│    │ flowStore       │          │   │ Redis           │   │     │
│    │ (In-Memory)     │          │   │                 │   │     │
│    │ - Latest bar    │          │   │ - SET latest    │   │     │
│    │ - 100 bar hist  │          │   │ - RPUSH today   │   │     │
│    └─────────────────┘          │   │ - XADD stream   │   │     │
│                                 │   │ - PUBLISH bars  │   │     │
│                                 │   └────────┬────────┘   │     │
│                                 │            │            │     │
│                                 │            ▼            │     │
│                                 │   ┌─────────────────┐   │     │
│                                 │   │ TimescaleDB     │   │     │
│                                 │   │ (non-blocking)  │   │     │
│                                 │   │ - INSERT bar    │   │     │
│                                 │   └─────────────────┘   │     │
│                                 │                         │     │
└─────────────────────────────────┴─────────────────────────┴─────┘
                             │
                      Redis Stream
                   (market_data)
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  WebSocket     │  │  Future        │  │  ML/AI         │
│  Clients       │  │  Workers       │  │  Pipeline      │
│  (Frontend)    │  │  (Backtesting) │  │  (Training)    │
└────────────────┘  └────────────────┘  └────────────────┘
```

### Client Data Access Pattern

1. **Historical Data:** Fetch from TimescaleDB (via REST API or cache)
2. **Today's Data:** Read from Redis Stream (from start of day)
3. **Live Updates:** Subscribe to Redis Stream for new events

### Daily Operations

| Time (ET)   | Job                   | Actions                                     |
| ----------- | --------------------- | ------------------------------------------- |
| 2:00 AM     | Daily Clear           | Clear `bar:today:*` and `bar:latest:*` keys |
| 3:00 AM     | Front Month Detection | Update `cache:front-months`                 |
| 1st @ 00:05 | Subscription Refresh  | Update WebSocket subscriptions              |

---

## Configuration

### Limits (from `config/limits.ts`)

| Constant               | Value      | Description                         |
| ---------------------- | ---------- | ----------------------------------- |
| `maxHubBars`           | 86,400     | Max bars in Redis List per symbol   |
| `maxFlowHistoryBars`   | 100        | Max bars in Hub's in-memory history |
| `redisScanBatchSize`   | 100        | Batch size for SCAN operations      |
| `redisDeleteBatchSize` | 100        | Batch size for DEL operations       |
| `maxStreamLength`      | 10,000,000 | Max entries in Redis Stream         |

### Environment Variables

| Variable       | Description                           |
| -------------- | ------------------------------------- |
| `REDIS_URL`    | Redis connection URL (Railway format) |
| `REDIS_HOST`   | Redis host (local Docker)             |
| `REDIS_PORT`   | Redis port (local Docker)             |
| `DATABASE_URL` | TimescaleDB connection string         |
