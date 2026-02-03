# Redis Architecture

Redis serves as the **hot data layer** for real-time market data distribution and storage. The frontend reads directly from Redis via backend REST endpoints.

---

## Key Structure Overview

### Real-Time Bar Data (Current)

| Key Pattern | Type | Description | TTL |
|-------------|------|-------------|-----|
| `bar:latest` | **HASH** | Symbol → Bar JSON (all latest bars in one hash) | Cleared daily |
| `bar:today:{symbol}` | **LIST** | Today's bars for a specific symbol | Cleared daily |
| `market_data` | **STREAM** | Real-time event bus (~10M max) | Cleared daily |
| `bars` | **PUB/SUB** | Legacy channel (maintained for compatibility) | N/A |

### Contract Snapshots (Planned)

| Key Pattern | Type | Description | Source |
|-------------|------|-------------|--------|
| `snapshot:{symbol}` | **HASH** | Full contract snapshot from exchange | Polygon Snapshot API |
| `session:{symbol}` | **HASH** | Intraday rolling calculations (VWAP, CVOL) | Computed from bars |

### Metadata & Jobs

| Key Pattern | Type | Description |
|-------------|------|-------------|
| `meta:trading_date` | **STRING** | Last trading date (YYYY-MM-DD) |
| `meta:bar_count` | **STRING** | Total bars processed today |
| `job:clear:status` | **STRING (JSON)** | Daily clear job status |
| `job:refresh:status` | **STRING (JSON)** | Monthly subscription refresh job status |
| `job:front-months:status` | **STRING (JSON)** | Front month detection job status |
| `cache:front-months` | **STRING (JSON)** | Front month contract cache |

---

## Snapshot Keyspace (Planned Implementation)

> [!IMPORTANT]
> This section documents the **planned** keyspace for contract snapshots. Implementation is pending.

> [!CAUTION]
> **Polygon Futures Beta Limitations:**
> - Depth of book data is NOT available
> - Options on futures are NOT included
> - Do not implement features requiring these until out of beta

### Source: Polygon Snapshot API

We only use `details` and `session` from the snapshot response. Real-time fields (`last_minute`, `last_trade`, `last_quote`) are already handled by our WebSocket stream.

```json
{
  "details": {
    "ticker": "ESH6",
    "product_code": "ES",
    "settlement_date": "2026-03-20"
  },
  "session": {
    "open": 7004.25,
    "high": 7027.25,
    "low": 7002.5,
    "close": 7012.25,
    "volume": 109330,
    "settlement_price": 7012.25,
    "previous_settlement": 7002.5,
    "change": 9.75,
    "change_percent": 0.139
  }
}
```

### Refresh Strategy

> [!WARNING]
> **Current:** Refresh at session open (timing TBD per exchange).  
> **Future:** Needs per-product session handling. See `TODO.md`.

### `snapshot:{symbol}` Hash

Populated from Polygon Snapshot API at session open.

| Field | Type | Description |
|-------|------|-------------|
| `productCode` | string | Root symbol (e.g., "ES") |
| `settlementDate` | string | Contract expiry (YYYY-MM-DD) |
| `sessionOpen` | number | Session open price |
| `sessionHigh` | number | Session high |
| `sessionLow` | number | Session low |
| `sessionClose` | number | Session close (prev session) |
| `sessionVolume` | number | Session volume |
| `settlementPrice` | number | Official settlement price |
| `prevSettlement` | number | Previous session settlement |
| `change` | number | Price change ($) |
| `changePct` | number | Price change (%) |
| `openInterest` | number | Open interest (if available) |
| `timestamp` | number | Snapshot timestamp (epoch ms) |

### `session:{symbol}` Hash

Rolling intraday calculations computed from incoming bars.

| Field | Type | Description |
|-------|------|-------------|
| `vwap` | number | Volume-weighted average price |
| `cvol` | number | Cumulative volume (session) |
| `tradeCount` | number | Total trades (session) |
| `dayHigh` | number | Session high (rolling) |
| `dayLow` | number | Session low (rolling) |
| `dayOpen` | number | First bar open of session |
| `timestamp` | number | Last update (epoch ms) |

### Calculation Logic

**VWAP Formula:**
```
VWAP = Σ(price × volume) / Σ(volume)
```

On each bar:
```typescript
cumPriceVolume += bar.close * bar.volume;
cumVolume += bar.volume;
vwap = cumPriceVolume / cumVolume;
```

---

## Data Flow

### Current (Bars)
```
Polygon WS → ws_client.ts → Redis
                              ├── HSET bar:latest
                              ├── RPUSH bar:today:{symbol}
                              ├── XADD market_data
                              └── PUBLISH bars
```

### Planned (Snapshots)

```
Polygon Snapshot API → snapshot_job.ts → Redis
                                          └── HSET snapshot:{symbol}

bar:latest updates → session_calc.ts → Redis
                                        └── HSET session:{symbol}
```

---

## Session Time Handling

> [!WARNING]
> Session times vary by exchange and product. Implementation TBD.

| Exchange | Products | Session Notes |
|----------|----------|---------------|
| CME Globex | ES, NQ, etc. | Nearly 24h (Sun 5pm - Fri 4pm CT, 1h break) |
| CBOT | ZC, ZW, etc. | Split sessions with breaks |
| COMEX | GC, SI | Follows CME Globex schedule |
| NYMEX | CL, NG | Follows CME Globex schedule |
| ICE | KC, CT, etc. | Different schedule |

**Current Approach:** Single daily reset at 2 AM ET for all products.

**Future:** Per-product session handling based on exchange calendars.

---

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

---

## Redis CLI Examples

```bash
# Real-time bars
HGET bar:latest ESH6
HGETALL bar:latest
LRANGE bar:today:ESH6 0 -1

# Snapshots (planned)
HGETALL snapshot:ESH6
HGET snapshot:ESH6 settlementPrice

# Session data (planned)
HGETALL session:ESH6
HGET session:ESH6 vwap

# Stats
GET meta:trading_date
GET meta:bar_count
```

---

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

### Planned APIs

```typescript
// Snapshot data
const snap = await redisStore.getSnapshot("ESH6");
const allSnaps = await redisStore.getAllSnapshots();

// Session calculations
const session = await redisStore.getSession("ESH6");
```

---

## Daily Reset (2 AM ET)

The `clearTodayData()` function:
- Deletes `bar:latest` hash
- Deletes all `bar:today:*` lists
- Deletes `market_data` stream
- Resets `meta:bar_count` to 0
- Updates `meta:trading_date`
- **Planned:** Resets `session:*` hashes

---

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
