# MK3 Futures Dashboard - System Overview

**Last Updated:** November 9, 2025  
**Status:** Core Hub Infrastructure Complete ✅

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Current Status](#current-status)
3. [Completed Features](#completed-features)
4. [Development Roadmap](#development-roadmap)
5. [Technical Details](#technical-details)

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    POLYGON.IO (Data Source)                 │
│                    WebSocket API - Futures                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     HUB SERVER (Backend)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Polygon WS Client (Self-Healing)                     │  │
│  │  - Auto-reconnect with exponential backoff            │  │
│  │  - Market hours detection                             │  │
│  │  - Dynamic contract subscriptions                     │  │
│  │  - Monthly auto-refresh (1st @ 00:05 ET)              │  │
│  └───────────┬──────────────────────────┬────────────────┘  │
│              │                          │                   │
│              ▼                          ▼                   │
│  ┌──────────────────┐      ┌──────────────────────────┐     │
│  │   flowStore      │      │       Redis              │     │
│  │   (In-Memory)    │      │    (Persistent+Stream)   │     │
│  │                  │      │                          │     │
│  │  • Latest bars   │      │  • Stream: market_data   │     │
│  │  • 100 bar hist  │      │  • bar:today:{symbol}    │     │
│  │  • Per symbol    │      │  • Job status            │     │
│  └──────────────────┘      │  • Daily clear @ 2 AM    │     │
│                            └──────┬───────────────────┘     │
│                                   ▼                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Hub REST API (Port 3001)                  │  │
│  │  GET  /health                                         │  │
│  │  GET  /bars/latest                                    │  │
│  │  GET  /admin/subscriptions                            │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                     Redis Stream
                (Key: "market_data")
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│        CLIENTS          │     │     WORKERS (Future)    │
│ (Frontend / Edge / App) │     │   (ML / Backtesting)    │
│                         │     │                         │
│ - XREADGROUP market_data│     │ - XREADGROUP market_data│
│ - Real-time updates     │     │ - Feature extraction    │
│                         │     │ - History storage       │
└─────────────────────────┘     └─────────────────────────┘
```

---

## Current Status

### ✅ **Phase 1: Hub Core Infrastructure (COMPLETE)**

The Hub server is production-ready with:

1. **Real-Time Data Ingestion** ✅

   - Polygon WebSocket client with self-healing capabilities
   - Subscribes to US indices (ES, NQ, YM, RTY) + metals (GC, SI, HG, PL, PA, MGC)
   - Handles per-second aggregate data (`A` event type)

2. **Smart Contract Management** ✅

   - Dynamic contract builders for quarterly (indices) and monthly (metals)
   - Asset class metadata for intelligent subscription tracking
   - Configurable contract counts (`SUBSCRIPTION_CONFIG`)

3. **Automated Subscription Refresh** ✅

   - Monthly cron job (1st @ 00:05 ET)
   - Quarterly check for indices (Mar/Jun/Sep/Dec)
   - Monthly check for metals (every month)
   - Partial success handling (some assets can fail)
   - Status persistence across restarts

4. **Dual Storage System** ✅

   - **flowStore (Memory):** Latest bars + 100-bar rolling history per symbol
   - **Redis (Persistent + Pub/Sub):**
     - Keys: Today's bars + job status + metadata
     - Pub/Sub: Channel `bars` for real-time Edge streaming
   - Daily clear job (2 AM ET) with batched deletes (scales to 500+ tickers)

5. **REST API** ✅

   - Health monitoring with job status
   - Bar queries (latest, today, per symbol)
   - Admin endpoints for manual operations
   - Subscription inspection

6. **Operational Excellence** ✅
   - Self-healing WS with exponential backoff
   - Market hours detection (no false alarms on weekends)
   - Job status persistence (survives restarts)
   - Comprehensive logging
   - Non-blocking Redis operations (SCAN vs KEYS)

---

## Completed Features

### 1. Polygon WebSocket Client (`api/polygon/ws_client.ts`)

**Capabilities:**

- Connect to Polygon futures market
- Subscribe/unsubscribe dynamically
- Update subscriptions atomically (with retry)
- Auto-reconnect with exponential backoff (500ms → 20s cap)
- Market hours awareness
- Health monitoring

**Connection States:**

- `DISCONNECTED` → `CONNECTING` → `CONNECTED` → `SUBSCRIBED`
- Handles transitions gracefully
- Saves subscription context for reconnects

### 2. Contract Builders (`utils/cbs/`)

**US Indices Builder** (`us_indices_cb.ts`):

- Quarterly contracts: H (Mar), M (Jun), U (Sep), Z (Dec)
- Current quarter + N future quarters
- Example: `ESZ25, NQZ25, YMZ25, RTYZ25`

**Metals Builder** (`metals_cb.ts`):

- Monthly contracts: All 12 months (F, G, H, J, K, M, N, Q, U, V, X, Z)
- Current month + N future months
- Example: `GCX25, SIX25, HGX25, PLX25, PAX25, MGCX25`

**Configuration** (`config/subscriptions.ts`):

```typescript
US_INDICES_QUARTERS: 1; // Change to 2 for roll coverage
METALS_MONTHS: 1; // Change to 2 for roll coverage
```

### 3. Data Stores

**flowStore** (`data/flow_store.ts`):

- Singleton pattern
- In-memory storage
- Methods: `setBar()`, `getLatest()`, `getAllLatest()`, `getHistory()`, `getSymbols()`
- Keeps 100 bars per symbol (rolling window)

**redisStore** (`data/redis_store.ts`):

- Singleton pattern
- Redis connection with retry strategy
- Methods: `writeBar()`, `getLatest()`, `getTodayBars()`, `getStats()`, `clearTodayData()`
- Batched operations for scalability
- Non-blocking key scanning

### 4. Jobs System

**Daily Clear Job** (`jobs/clear_daily.ts`):

- Schedule: 2 AM ET daily
- Clears yesterday's data
- Prevents duplicate clears (checks `meta:trading_date`)
- Tracks: `lastRunTime`, `lastSuccess`, `totalRuns`, `clearedKeys`
- Status persisted to Redis

**Monthly Subscription Refresh** (`jobs/refresh_subscriptions.ts`):

- Schedule: 1st of month @ 00:05 ET
- Smart detection: Quarterly for indices, monthly for metals
- Per-asset error handling
- Detailed refresh tracking per asset class/event type
- Status persisted to Redis

### 5. Hub REST API (`servers/hub/api.ts`)

**Health & Monitoring:**

- `GET /health` - System status, Redis stats, job statuses, symbol count

**Data Access:**

- `GET /bars/latest` - All latest bars from flowStore
- `GET /bars/latest/:symbol` - Specific symbol's latest bar
- `GET /bars/today/:symbol` - All today's bars from Redis
- `GET /symbols` - List of subscribed symbols

**Admin Operations:**

- `GET /admin/subscriptions` - Inspect current WS subscriptions
- `POST /admin/clear-redis` - Manual trigger for daily clear
- `POST /admin/refresh-subscriptions` - Manual trigger for subscription refresh

### 6. Type System (`utils/types.ts`)

**Key Types:**

- `PolygonWsRequest` - Subscription request with asset class metadata
- `PolygonAssetClass` - `"us_indices" | "metals"`
- `Bar` - Normalized bar data structure
- `RefreshJobStatus` - Refresh job state tracking
- `RefreshDetails` - Per-asset refresh results

---

## Development Roadmap

### ✅ Phase 1: Hub Core Infrastructure (COMPLETE)

- [x] Polygon WS client with self-healing
- [x] Dual storage (flowStore + Redis)
- [x] Dynamic contract builders
- [x] Automated subscription refresh
- [x] Daily Redis clear job
- [x] Hub REST API
- [x] Comprehensive documentation

**Effort:** ~40 hours  
**Status:** Production-ready

---

### 🔜 Phase 2: TimescaleDB Integration (12-16 hours)

**Goal:** Store historical data for charting and ML.

**Architecture:**

```
Hub Server
└─ Write to TimescaleDB (Hypertable)
   ├─ time, symbol, o, h, l, c, v
   └─ Retention policies
```

**Tasks:**

1.  Set up TimescaleDB (Docker)
2.  Create schema with hypertables
3.  Daily download job (Polygon flat files API)
4.  Bulk insert script
5.  Query API (historical bars by range)
6.  Index optimization (symbol, timestamp)
7.  Retention policies (1 year? 5 years?)

**Deliverables:**

- TimescaleDB schema
- Daily download job
- Historical query API
- Performance benchmarks

---

### 🔜 Phase 3: ML Data Export (8-12 hours)

**Goal:** Export data for ML training.

**Architecture:**

```
Export Job (Weekly/On-Demand)
├─ Query TimescaleDB
├─ Generate features (rolling averages, volatility, etc.)
├─ Export to Parquet/CSV
└─ Upload to S3 or local storage
```

**Tasks:**

1.  Feature engineering pipeline
2.  Export formats (Parquet, CSV)
3.  Configurable date ranges
4.  Symbol selection
5.  Export API endpoint
6.  Storage integration (S3 or local)

**Deliverables:**

- Export job
- Feature library
- API endpoint
- Storage integration

---

### 🔜 Phase 4: Frontend Dashboard (24-32 hours)

**Goal:** User-facing real-time dashboard.

**Architecture:**

```
React/Next.js Frontend
├─ WebSocket client (connects to Edge)
├─ Real-time chart (TradingView or Chart.js)
├─ Multi-ticker layout
├─ Contract selector (front month, next month, etc.)
├─ Roll indicators
└─ Historical chart overlay
```

**Tasks:**

1.  Set up Next.js project
2.  WebSocket client
3.  Real-time chart component
4.  Multi-ticker grid layout
5.  Contract selector UI
6.  Roll period indicators
7.  Responsive design
8.  Dark/light theme

**Deliverables:**

- Frontend application
- Real-time charts
- Multi-ticker dashboard
- Deployment config

---

## Technical Details

### Technology Stack

**Backend:**

- **Runtime:** Node.js 22.x with TypeScript
- **WebSocket:** Polygon.io client-js library
- **Storage:** Redis (in-memory), TimescaleDB (future)
- **Jobs:** node-cron
- **API:** Express.js
- **Testing:** Manual + integration tests (future)

**Infrastructure:**

- **Containerization:** Docker + Docker Compose
- **Development:** WSL2 on Windows
- **Package Manager:** npm

### File Structure

```
backend/
├── src/
│   ├── api/
│   │   └── polygon/
│   │       └── ws_client.ts          # Polygon WS client
│   ├── config/
│   │   ├── env.ts                    # Environment variables
│   │   ├── limits.ts                 # System limits
│   │   └── subscriptions.ts          # Contract count config
│   ├── data/
│   │   ├── flow_store.ts             # In-memory store
│   │   └── redis_store.ts            # Redis operations
│   ├── jobs/
│   │   ├── clear_daily.ts            # Daily Redis clear
│   │   └── refresh_subscriptions.ts  # Monthly refresh
│   ├── servers/
│   │   └── hub/
│   │       ├── index.ts
│   │       └── api/                   # Apis entry point
│   │          └── api.ts              # REST API
│   ├── utils/
│   │   ├── cbs/
│   │   │   ├── us_indices_cb.ts      # US indices builder
│   │   │   └── metals_cb.ts          # Metals builder
│   │   ├── consts.ts                 # Constants
│   │   ├── polygon_utils.ts          # Polygon helpers
│   │   ├── tickers.ts                # Ticker loader
│   │   └── types.ts                  # TypeScript types
│   └── tests/                        # Test files
├── docs/
│   ├── system-overview.md            # This file
│   ├── architecture.md               # Architecture details
│   ├── futures-contract-management.md # Contract strategy
│   ├── subscription-refresh-implementation.md
│   └── testing-subscription-refresh.md
├── tickers/                          # Ticker metadata (JSON)
├── docker-compose.yml                # Container orchestration
├── Dockerfile                        # Backend container
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript config
```

### Data Flow

**Real-Time Ingestion:**

```
Polygon WS → ws_client.handleMessage()
           → aggregateToBar()
           → flowStore.setBar()
           → redisStore.writeBar()
```

**Daily Clear (2 AM ET):**

```
Cron trigger → dailyClearJob.runClear()
            → redisStore.clearTodayData()
            → Scan keys (SCAN)
            → Delete in batches (DEL)
            → Update meta:trading_date
            → Save job status
```

**Monthly Refresh (1st @ 00:05 ET):**

```
Cron trigger → monthlySubscriptionJob.runRefresh()
            → shouldRefreshIndices() / shouldRefreshMetals()
            → Build new request (usIndicesBuilder / metalsBuilder)
            → Find current subscription (by asset class)
            → Compare symbols
            → wsClient.updateSubscription() if changed
            → Save job status
```

---

## Configuration

### Environment Variables (`.env`)

```bash
# Polygon API
POLYGON_API_KEY=your_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Hub Server
HUB_REST_PORT=3001
```

### Subscription Configuration (`config/subscriptions.ts`)

```typescript
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 1, // 1 = current, 2 = current + next
  METALS_MONTHS: 1, // 1 = current, 2 = current + next
} as const;
```

**To subscribe to more contracts for roll coverage:**

- Change `US_INDICES_QUARTERS` to `2`
- Change `METALS_MONTHS` to `2`
- Restart Hub

---

## Testing

### Start the Hub

```bash
cd /home/david/dev/mk3/backend
npx tsx src/servers/hub/index.ts
```

### Test Endpoints

```bash
# Health check
curl http://localhost:3001/health | jq

# Current subscriptions
curl http://localhost:3001/admin/subscriptions | jq

# Manual refresh trigger
curl -X POST http://localhost:3001/admin/refresh-subscriptions | jq

# Latest bars
curl http://localhost:3001/bars/latest | jq

# Today's bars for ES
curl http://localhost:3001/bars/today/ESZ25 | jq
```

### Comprehensive Testing

See `docs/testing-subscription-refresh.md` for detailed testing scenarios.

---

## Next Steps

### Immediate (Phase 2 - Next 2 weeks)

1. **Add Softs Contract Builder**

   - Research trading cycles for KT, CJ, TT, YO
   - Implement builder class
   - Add to refresh job

2. **Add Energies Contract Builder**

   - Research CL, NG, RB, HO cycles
   - Implement builder class
   - Add to refresh job

3. **Test Multi-Asset Refresh**

   - Verify quarterly detection for indices
   - Verify monthly detection for metals
   - Verify mixed cycles for other assets

4. **Performance Testing**
   - Measure memory usage with 50+ symbols
   - Redis performance with 500+ tickers
   - Subscription update time

### Medium-Term (Phase 3-4 - Next 1-2 months)

1. **Hub WS Server**

   - Define protocol (JSON messages)
   - Implement pub/sub from flowStore
   - Connection management

2. **Edge Server**

   - Front month algorithm (volume-based)
   - Roll detection
   - Symbol mapping
   - Continuous contracts

3. **Integration Testing**
   - Hub → Edge → Mock Client
   - End-to-end data flow
   - Failover testing

### Long-Term (Phase 5-7 - Next 3-6 months)

1. **TimescaleDB**

   - Historical data pipeline
   - Query optimization
   - Retention policies

2. **ML Export**

   - Feature engineering
   - Export formats
   - Storage integration

3. **Frontend**
   - Real-time dashboard
   - Chart integration
   - User experience

---

## Success Metrics

### Phase 1 (Current) ✅

- [x] Hub runs 24/7 without crashes
- [x] Self-healing WS reconnects automatically
- [x] Subscriptions refresh monthly without intervention
- [x] Daily clear runs at 2 AM ET
- [x] REST API responds < 100ms
- [x] Status persists across restarts

### Phase 2 (Next)

- [ ] Support 50+ futures symbols
- [ ] All asset classes covered (indices, metals, softs, energies, grains, treasuries)
- [ ] Subscription refresh handles mixed cycles
- [ ] Performance validated with full symbol set

### Phase 3-4

- [ ] Edge server detects front month correctly
- [ ] Roll periods handled seamlessly
- [ ] End-to-end latency < 500ms

### Phase 5-7

- [ ] Historical data available for 1+ year
- [ ] ML export generates clean datasets
- [ ] Frontend dashboard updates in real-time
- [ ] User can view 20+ tickers simultaneously

---

## Documentation

### Core Documents

1. **system-overview.md** (this file) - Big picture, roadmap, current status
2. **architecture.md** - Technical architecture, data flow
3. **futures-contract-management.md** - Contract lifecycle strategy
4. **subscription-refresh-implementation.md** - Refresh job implementation
5. **testing-subscription-refresh.md** - Testing guide

### Code Documentation

- Inline comments for complex logic
- JSDoc for public APIs
- README files in each major directory (future)

---

## Maintenance

### Daily

- Monitor Hub logs for errors
- Check `/health` endpoint for job status

### Weekly

- Review Redis memory usage
- Check flowStore symbol count

### Monthly

- Verify subscription refresh ran successfully (check logs on 1st)
- Review job status: `curl http://localhost:3001/health | jq '.subscriptionRefreshJob'`

### Quarterly

- Verify indices rolled correctly (Mar/Jun/Sep/Dec)
- Check contract symbols in `/admin/subscriptions`

---

## Contact & Support

**Project:** MK3 Futures Dashboard  
**Owner:** David  
**Environment:** WSL2, Node.js 22.x, TypeScript  
**Repository:** `/home/david/dev/mk3`

For questions or issues, refer to documentation in `backend/docs/`.
