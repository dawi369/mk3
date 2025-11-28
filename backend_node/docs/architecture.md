## Backend Architecture

> For comprehensive system overview, see [system-overview.md](./system-overview.md)

**Current Phase: Phase 1 Complete ✅ | Edge Phase 1 Complete ✅ | Edge Phase 2 Next 🔄**

---

## Phase 1: Hub Core Infrastructure - COMPLETE ✅

### Completed Components

**1. Polygon WS Client**

- Self-healing with exponential backoff (500ms → 20s)
- Auto-reconnect with subscription preservation
- Market hours detection
- Dynamic subscribe/unsubscribe/update

**2. Smart Contract Management**

- Dynamic builders: US indices (quarterly), metals (monthly)
- Asset class metadata for intelligent tracking
- Configurable contract counts (`SUBSCRIPTION_CONFIG`)
- Automated monthly refresh (1st @ 00:05 ET)

**3. Dual Storage System**

- **flowStore:** In-memory, latest + 100 bars per symbol
- **Redis:** Persistent storage + pub/sub
  - Keys: `bar:latest:*`, `bar:today:*`
  - Pub/sub: Channel `bars` for real-time streaming
  - Daily clear (2 AM ET) with batched operations
  - Scales to 500+ tickers

**4. Hub REST API (Port 3001)**

- Health monitoring with job statuses
- Bar queries (latest, today, per symbol)
- Admin endpoints (clear, refresh, subscriptions)

**5. Job System**

- Daily Redis clear: 2 AM ET
- Monthly subscription refresh: 1st @ 00:05 ET
- Status persistence across restarts
- Partial success handling

---

## Data Flow

```
Polygon WS (futures)
       ↓
  ws_client.ts (normalize + Zod validate)
       ↓
  ┌────┴────┐
  ↓         ↓
flowStore  redisStore
            ↓
        Redis:
        - SET bar:latest:*
        - RPUSH bar:today:*
        - XADD market_data (Stream)
        - PUBLISH bars (Legacy Pub/Sub)
            ↓
        Clients / Workers
        - XREADGROUP market_data
        - Real-time processing
```

**Hub-Client Communication:** Redis Stream (Durable Log)

- Hub writes to `market_data` stream.
- Clients (Edge/Frontend/Workers) consume via Consumer Groups.
- Legacy Pub/Sub `bars` channel is maintained for backward compatibility.

---

## Hub REST API Endpoints

### Health & Monitoring

- `GET /health` - System status, Redis stats, job statuses, symbol count

### Data Access

- `GET /bars/latest` - All latest bars from flowStore
- `GET /bars/latest/:symbol` - Specific symbol's latest bar
- `GET /bars/today/:symbol` - All today's bars from Redis
- `GET /symbols` - List of subscribed symbols

### Admin Operations

- `GET /admin/subscriptions` - Inspect current WS subscriptions
- `POST /admin/clear-redis` - Manual trigger for daily clear
- `POST /admin/refresh-subscriptions` - Manual trigger for subscription refresh

---

## Current Subscriptions

**US Indices (Quarterly - H, M, U, Z):**

- ES (E-mini S&P 500)
- NQ (E-mini NASDAQ-100)
- YM (E-mini Dow)
- RTY (E-mini Russell 2000)

**Metals (Monthly - All 12 months):**

- GC (Gold)
- SI (Silver)
- HG (Copper)
- PL (Platinum)
- PA (Palladium)
- MGC (Micro Gold)

**Configuration:**

```typescript
// config/subscriptions.ts
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 1, // Current quarter
  METALS_MONTHS: 1, // Current month
} as const;
```

---

## Legacy Components

### Edge Server (Deprecated)

The original plan included a dedicated Edge Server for WebSocket handling. This has been replaced by direct Redis Stream consumption by clients/workers. The existing Edge code is maintained for legacy support until migration is complete.

---

## Phase 2: Historical Data Architecture (In Progress)

### Storage Strategy

- **Real-time (Today):** Redis Streams & Lists.
  - Source of Truth for "Today's" data.
  - Cleared daily after market close.
- **Historical (Yesterday+):** TimescaleDB (Postgres).
  - Source of Truth for all past data.
  - **Ingestion:** Hub writes to TimescaleDB asynchronously for every incoming bar (Real-time).
  - **Reconciliation:** Daily Cron Job (optional) can fetch previous day's aggregates to ensure completeness.

### Caching Layer (Redis)

- **Read-Through Cache:**
  - Clients request history -> Hub checks Redis `history:SYMBOL:YYYY-MM`.
  - **Hit:** Return compressed data.
  - **Miss:** Query TimescaleDB -> Compress (Gzip) -> Store in Redis -> Return.
- **Retention:**
  - Cache keys set to expire (e.g., 1 year) or LRU eviction.
  - 1-minute resolution for all history.

4.  **Response:** Combine chunks and send to client.

**Key Benefits:**

- **Zero DB Load** for 99% of requests.
- **Low Latency:** Compressed data transfers 10x faster.
- **Scalability:** Redis handles the read volume; TimescaleDB only handles the "first write" of the day.

### Data Retention & Format

- **Granularity:** 1-minute bars.
- **Retention:** 1 year per ticker.
- **Storage:**
  - **TimescaleDB:** Raw, uncompressed rows (source of truth).
  - **Redis:** Compressed JSON blobs, chunked by month.

---

## Future Phases

### Phase 3: Multi-Asset Expansion (8-12 hours)

**Goal:** Add contract builders for softs, energies, grains, treasuries

**See [system-overview.md](./system-overview.md) for complete roadmap.**
