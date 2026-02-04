# Database Structures

## Redis

### Key Structure

| Key Pattern | Type | Description |
|-------------|------|-------------|
| `bar:latest` | HASH | Symbol → Bar JSON |
| `ts:bar:{tf}:{symbol}:{field}` | TIMESERIES | 1s + downsampled bars (7 day retention) |
| `market_data` | STREAM | Real-time event bus |
| `meta:trading_date` | STRING | Current date (YYYY-MM-DD) |
| `meta:bar_count` | STRING | Total bars today |
| `job:clear:status` | STRING (JSON) | Clear job status |
| `job:refresh:status` | STRING (JSON) | Refresh job status |
| `job:front-months:status` | STRING (JSON) | Front month job status |

### Bar JSON

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

### Stream Operations

```bash
# Write
XADD market_data MAXLEN ~ 10000000 * data <JSON>

# Read (blocking)
XREAD BLOCK 5000 STREAMS market_data $

# Read (history)
XREVRANGE market_data + - COUNT 100
```

### TimeSeries Operations

```bash
# Write (multiple fields at once)
TS.MADD ts:bar:1s:ESH6:open 1702560000000 5000.25 ts:bar:1s:ESH6:close 1702560000000 5000.75

# Range (1m)
TS.MRANGE - + FILTER symbol=ESH6 tf=1m
```

## TimescaleDB

### Table: `bars`

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | TEXT | Contract ticker (e.g., "ESZ25") |
| `open` | DOUBLE PRECISION | Opening price |
| `high` | DOUBLE PRECISION | High price |
| `low` | DOUBLE PRECISION | Low price |
| `close` | DOUBLE PRECISION | Closing price |
| `volume` | DOUBLE PRECISION | Volume |
| `vwap` | DOUBLE PRECISION | Volume-weighted avg price |
| `timestamp` | TIMESTAMPTZ | Bar timestamp |

**Constraints:** `UNIQUE (symbol, timestamp)`

**Index:** `(symbol, timestamp DESC)`

### Continuous Aggregate: `bars_30m`

Materialized 30-minute OHLCV for analytics + backtesting.

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | TEXT | Contract ticker |
| `bucket` | TIMESTAMPTZ | 30-minute bucket start |
| `open` | DOUBLE PRECISION | First open in bucket |
| `high` | DOUBLE PRECISION | Max high in bucket |
| `low` | DOUBLE PRECISION | Min low in bucket |
| `close` | DOUBLE PRECISION | Last close in bucket |
| `volume` | DOUBLE PRECISION | Sum volume |
| `vwap` | DOUBLE PRECISION | Volume-weighted avg price |

**Index:** `(symbol, bucket DESC)`

### Insert Example

```sql
INSERT INTO bars (symbol, open, high, low, close, volume, vwap, timestamp)
VALUES ('ESZ25', 5000.25, 5001.50, 4999.00, 5000.75, 1234, 5000.50, NOW())
ON CONFLICT (symbol, timestamp) DO UPDATE SET
  open = EXCLUDED.open, high = EXCLUDED.high,
  low = EXCLUDED.low, close = EXCLUDED.close,
  volume = EXCLUDED.volume, vwap = EXCLUDED.vwap;
```

## Data Flow

```
Polygon WS → Hub Server
               │
               ├─→ Redis (real-time)
               │     ├─ HSET bar:latest
               │     ├─ TS.MADD ts:bar:1s:{symbol}:{field}
               │     └─ XADD market_data
               │
               └─→ TimescaleDB (historical)
                     └─ INSERT bars
```

## Configuration

### Limits (`src/config/limits.ts`)

| Constant | Value | Description |
|----------|-------|-------------|
| `redisTsRetentionMs` | 604,800,000 | TimeSeries retention (7 days) |
| `redisScanBatchSize` | 100 | Batch size for SCAN |
| `redisDeleteBatchSize` | 100 | Batch size for DEL |
| `maxStreamLength` | 10,000,000 | Max entries in Stream |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `DATABASE_URL` | TimescaleDB connection string |
