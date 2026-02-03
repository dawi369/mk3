# Redis Architecture

Redis serves as the **hot data layer** for real-time market data distribution and storage.

## Key Structure

| Key Pattern | Type | Description | TTL |
|-------------|------|-------------|-----|
| `bar:latest` | **HASH** | Symbol → Bar JSON (all latest bars in one hash) | Cleared daily |
| `bar:today:{symbol}` | **LIST** | Today's bars for a specific symbol | Cleared daily |
| `market_data` | **STREAM** | Real-time event bus (~10M max) | Cleared daily |
| `bars` | **PUB/SUB** | Legacy channel (maintained for compatibility) | N/A |
| `meta:trading_date` | **STRING** | Last trading date (YYYY-MM-DD) | None |
| `meta:bar_count` | **STRING** | Total bars processed today | Cleared daily |
| `job:clear:status` | **STRING (JSON)** | Daily clear job status | None |
| `job:refresh:status` | **STRING (JSON)** | Monthly subscription refresh job status | None |
| `job:front-months:status` | **STRING (JSON)** | Front month detection job status | None |

## Bar Schema

```typescript
interface Bar {
  symbol: string;      // e.g. "ESH6"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  dollarVolume: number;
  startTime: number;   // epoch ms
  endTime: number;     // epoch ms
}
```

## Redis CLI Examples

```bash
# Connect to container
docker exec -it mk3-redis redis-cli

# Get all symbol keys
HKEYS bar:latest

# Get latest bar for a symbol
HGET bar:latest ESH6

# Get all latest bars
HGETALL bar:latest

# Get today's bars for a symbol
LRANGE bar:today:ESH6 0 -1

# Check stats
GET meta:trading_date
GET meta:bar_count

# Stream operations
XREAD COUNT 10 STREAMS market_data 0
```

## Backend API (`redisStore`)

```typescript
import { redisStore } from "@/server/data/redis_store.js";

// Single symbol
const bar = await redisStore.getLatest("ESH6");

// All symbols as map
const all = await redisStore.getAllLatest();  // { ESH6: Bar, ... }

// All symbols as array
const bars = await redisStore.getAllLatestArray();

// List of symbols
const symbols = await redisStore.getSymbols();

// Today's history
const history = await redisStore.getTodayBars("ESH6");

// Stats
const stats = await redisStore.getStats();  // { date, barCount, symbolCount }
```

## Data Flow

```
Polygon API → ws_client.ts → Redis
                               ├── HSET bar:latest
                               ├── RPUSH bar:today:{symbol}
                               ├── XADD market_data
                               └── PUBLISH bars
```

## Daily Reset (2 AM ET)

The `clearTodayData()` function:
- Deletes `bar:latest` hash
- Deletes all `bar:today:*` lists
- Deletes `market_data` stream
- Resets `meta:bar_count` to 0
- Updates `meta:trading_date`

## Configuration

| Env Variable | Default | Description |
|--------------|---------|-------------|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | - | Optional password |

## Docker

```yaml
redis:
  image: redis:8.2-alpine
  container_name: mk3-redis
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  command: redis-server --appendonly yes
```
