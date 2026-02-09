# Redis Architecture

Redis serves as the **hot data layer** for real-time market data distribution and storage. The frontend reads directly from Redis via backend REST endpoints.

---

## Key Structure Overview

### Real-Time Bar Data (TimeSeries + Stream)

| Key Pattern | Type | Description | TTL |
|-------------|------|-------------|-----|
| `bar:latest` | **HASH** | Symbol → Bar JSON (all latest bars in one hash) | Cleared daily |
| `ts:bar:{tf}:{symbol}:{field}` | **TIMESERIES** | 1s bars + downsampled timeframes | 7 days (retention) |
| `market_data` | **STREAM** | Real-time event bus (~10M max) | Cleared daily |
| `bars` | **PUB/SUB** | Legacy channel (maintained for compatibility) | N/A |

**Timeframes:** `1s`, `5s`, `30s`, `1m`, `5m`, `15m`, `1h`, `4h`, `1d`

**Fields:** `open`, `high`, `low`, `close`, `volume`, `trades`

### Contract Snapshots

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
| `job:snapshot:status` | **STRING (JSON)** | Snapshot fetch job status |
| `cache:front-months` | **STRING (JSON)** | Front month contract cache |

---

## Snapshot Keyspace

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

> [!NOTE]
> Snapshots are fetched at 2:05 AM ET via `snapshot_job.ts` (after daily clear at 2 AM).  
> Future: Needs per-product session handling. See `TODO.md`.

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
| `settlementPrice` | number | Official settlement price |
| `prevSettlement` | number | Previous session settlement |
| `change` | number | Price change ($) |
| `changePct` | number | Price change (%) |
| `openInterest` | number \| null | Open interest (if available) |
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
| `volNow` | number | Latest bar volume (current) |
| `volMin` | number | Minimum bar volume seen this session |
| `volMax` | number | Maximum bar volume seen this session |
| `volPos` | number | Current volume position (0-1) |
| `volBucket` | string | `low` / `mid` / `high` |
| `vwapMin` | number | Minimum VWAP seen this session |
| `vwapMax` | number | Maximum VWAP seen this session |
| `vwapPos` | number | Current VWAP position (0-1) |
| `vwapBucket` | string | `low` / `mid` / `high` |
| `cumPriceVolume` | number | Running total for VWAP calc |
| `cumVolume` | number | Running total for VWAP calc |
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

**Indicator Position (session scope):**
```
pos = (value - min) / (max - min)
bucket = low   if pos <= 0.33
bucket = mid   if pos <= 0.66
bucket = high  otherwise
```

- `volNow` uses the latest bar volume.
- `volMin/volMax` track the min/max bar volume seen this session.
- `vwapMin/vwapMax` track the min/max VWAP seen this session.

---

## Data Flow

### Current (Bars)
```
Polygon WS → ws_client.ts → Redis
                              ├── HSET bar:latest
                              ├── TS.MADD ts:bar:1s:{symbol}:{field}
                              ├── TS.CREATERULE (downsample to 5s/30s/1m/5m/15m/1h/4h/1d)
                              ├── XADD market_data
                              └── PUBLISH bars
```

### With Snapshots

```
Polygon Snapshot API → snapshot_job.ts → Redis
                                          └── HSET snapshot:{symbol}

bar:latest updates → redis_store.updateSession() → Redis
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

# TimeSeries range (1m)
TS.MRANGE - + FILTER symbol=ESH6 tf=1m

# Snapshots (planned)
HGETALL snapshot:ESH6
HGET snapshot:ESH6 settlementPrice

# Session data
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

// Snapshot data
const snap = await redisStore.getSnapshot("ESH6");
const allSnaps = await redisStore.getAllSnapshots();

// Session calculations
const session = await redisStore.getSession("ESH6");
const allSessions = await redisStore.getAllSessions();

// Write snapshot (used by snapshot_job)
await redisStore.writeSnapshot("ESH6", snapshotData);
```

### REST Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/bars/range/:symbol` | GET | No | TimeSeries range query (tf/start/end) |
| `/bars/week/:symbol` | GET | No | 7-day range (tf optional) |
| `/bars/today/:symbol` | GET | No | Today range (tf optional) |
| `/session/:symbol` | GET | No | Session data (VWAP, CVOL, etc.) |
| `/sessions` | GET | No | All session data |
| `/snapshot/:symbol` | GET | No | Snapshot for symbol |
| `/snapshots` | GET | No | All snapshots |
| `/admin/refresh-snapshots` | POST | Yes | Trigger snapshot refresh |

---

## Daily Reset (2 AM ET)

The `clearTodayData()` function:
- Deletes `bar:latest` hash
- Deletes `market_data` stream
- Deletes all `session:*` hashes
- Resets `meta:bar_count` to 0
- Updates `meta:trading_date`
- Does NOT delete TimeSeries data (retention handles history)

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
  image: redis/redis-stack-server:latest
  container_name: mk3-redis
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  command: redis-stack-server --appendonly yes
```
