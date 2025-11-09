## Backend Architecture

> For comprehensive system overview, see [system-overview.md](./system-overview.md)

**Current Phase: Phase 1 Complete | Phase 2 Next**

---

## Phase 1: Hub Core Infrastructure - COMPLETE

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
  ws_client.ts (normalize)
       ↓
  ┌────┴────┐
  ↓         ↓
flowStore  redisStore
            ↓
        Redis:
        - SET bar:latest:*
        - RPUSH bar:today:*
        - PUBLISH bars (pub/sub)
            ↓
        Edge Servers (future)
        - SUBSCRIBE bars (real-time)
        - GET bar:today:* (snapshot)
            ↓
        Frontend (future)
```

**Hub-Edge Communication:** Redis pub/sub (no direct connection)
- Hub publishes bars to Redis channel `bars`
- Edge subscribes to Redis channel
- Edge gets today's snapshot from Redis keys

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
  US_INDICES_QUARTERS: 1,  // Current quarter
  METALS_MONTHS: 1,         // Current month
} as const;
```

---

## Next Phase

### Phase 2: Multi-Asset Expansion (8-12 hours)

**Goal:** Add contract builders for softs, energies, grains, treasuries

**Tasks:**
1. Research trading cycles for each asset class
2. Implement builder classes
3. Extend `PolygonAssetClass` type
4. Update refresh job logic
5. Test multi-asset refresh

**See [system-overview.md](./system-overview.md) for complete roadmap.**