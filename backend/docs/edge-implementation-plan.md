# Edge Server Implementation Plan

**Status:** Phase 1 Complete ✅ | Phase 2 Next  
**Last Updated:** November 10, 2025

---

## Overview

Edge server is the client-facing layer that sits between Hub (data ingestion) and Frontend (user dashboards). Edge provides:

1. **Symbol subscription** - Clients can subscribe to specific symbols or all symbols
2. **Time-delayed streaming** - Configurable delay (default: real-time, can set 15-min delay)
3. **Contract grouping** - Group contracts by root symbol for frontend dropdown (ES → [ESZ25, ESH26, ESM26, ESU26])
4. **Asset class grouping** - Organize symbols by asset class (US indices, metals, etc.)
5. **Front month detection** - Determine current contract by date (not volume)

---

## Architecture

```
Hub (Polygon WS)
    ↓
Redis (persistent + pub/sub)
    ↓
Edge Server (YOU ARE HERE)
  ├─ Redis Client (Phase 1 ✅)
  ├─ Bar Cache (Phase 1 ✅)
  ├─ REST API (Phase 2 - Next)
  ├─ WebSocket Server (Phase 3)
  └─ Contract Mapper (Phase 4)
    ↓
Frontend Dashboard (Future)
```

---

## Phase 1: Redis Integration ✅ COMPLETE

**Goal:** Connect to Redis and receive real-time bars from Hub

**Completed:**
- ✅ Redis client with two connections (main + subscriber)
- ✅ Load today's snapshot from Redis on startup
- ✅ Subscribe to Redis pub/sub channel `bars`
- ✅ In-memory bar cache (10,000 bars per symbol)
- ✅ Stats logging every 10 seconds

**Files:**
- `src/servers/edge/data/bar_cache.ts` - In-memory cache
- `src/servers/edge/data/redis_client.ts` - Redis connection + pub/sub
- `src/servers/edge/index.ts` - Entry point

---

## Phase 2: Edge REST API (~2-3 hours)

**Goal:** Provide HTTP endpoints for data queries and observability

### Endpoints

#### Health & Monitoring
```
GET /health
Response: {
  status: "ok",
  uptime: 12345,
  cache: { symbols: 10, totalBars: 12500 },
  redis: { connected: true },
  hubConnected: true
}
```

#### Data Access
```
GET /bars/latest
Response: { symbol: Bar }[]

GET /bars/latest/:symbol
Response: Bar | null

GET /bars/history/:symbol?limit=100
Response: Bar[]

GET /symbols
Response: string[]

GET /symbols/grouped
Response: {
  "us_indices": ["ESZ25", "NQZ25", "YMZ25", "RTYZ25"],
  "metals": ["GCZ25", "SIZ25", "HGZ25", ...]
}
```

#### Contract Grouping
```
GET /contracts/:root
Response: {
  root: "ES",
  assetClass: "us_indices",
  contracts: [
    { symbol: "ESZ25", month: "Z", year: 2025, isFrontMonth: true },
    { symbol: "ESH26", month: "H", year: 2026, isFrontMonth: false },
    ...
  ]
}
```

### Implementation Steps

**Step 1:** Create REST API structure
- File: `src/servers/edge/api/rest.ts`
- Use Express (same as Hub)
- Port: `EDGE_REST_PORT` (env var, default: 3002)

**Step 2:** Implement basic endpoints
- `/health` - System status
- `/bars/latest` - All latest bars
- `/bars/latest/:symbol` - Specific symbol
- `/symbols` - List all symbols

**Step 3:** Add symbol grouping
- Load ticker metadata (use `Tickers` utility)
- Group symbols by asset class
- `/symbols/grouped` endpoint

**Step 4:** Add contract grouping
- Parse symbol to extract root + month + year
- Group by root symbol
- Use contract builder logic to determine front month
- `/contracts/:root` endpoint

**Step 5:** Add history endpoint
- `/bars/history/:symbol?limit=100`
- Return bars from cache with optional limit

---

## Phase 3: WebSocket Server (~4-6 hours)

**Goal:** Real-time streaming to frontend clients with subscription control and time delay

### Features

#### 1. Client Connection Management
- Accept WebSocket connections
- Track connected clients
- Handle disconnections gracefully

#### 2. Symbol Subscription
- **Default:** Client receives all symbols
- **Selective:** Client can subscribe to specific symbols
- Protocol:
```json
// Subscribe to specific symbols
{ "action": "subscribe", "symbols": ["ESZ25", "NQZ25"] }

// Subscribe to all symbols
{ "action": "subscribe", "symbols": ["*"] }

// Unsubscribe
{ "action": "unsubscribe", "symbols": ["ESZ25"] }
```

#### 3. Time-Delayed Streaming
- **Default:** Real-time (0 delay)
- **Configurable:** Client can request time delay (e.g., 15 minutes)
- **Emulation:** Not a batch refresh, but a time-shifted stream
  - If client requests 15-min delay, Edge sends bars that occurred 15 minutes ago
  - Maintains real-time flow, just offset in time
- **Initial Snapshot:** When client connects with delay, load snapshot from 15 minutes ago

**Example:**
```json
// Client connects with 15-min delay
{ "action": "connect", "delay": 900 } // 900 seconds = 15 min

// Edge sends bars from Redis cache that are 15 min old
// Bar with timestamp 10:00:00 is sent at 10:15:00
```

#### 4. Broadcasting
- When new bar arrives via pub/sub:
  - Check which clients are subscribed to that symbol
  - Check client's delay setting
  - If real-time (delay=0): send immediately
  - If delayed: queue bar and send after delay

### Implementation Steps

**Step 1:** Create WebSocket server
- File: `src/servers/edge/ws/server.ts`
- Use `ws` library (already in dependencies)
- Port: `EDGE_WS_PORT` (env var, default: 3003)

**Step 2:** Client connection management
- Track clients: `Map<clientId, ClientInfo>`
- `ClientInfo`: subscriptions, delay, lastHeartbeat

**Step 3:** Subscription handling
- Parse subscribe/unsubscribe messages
- Update client's subscription list
- Default: all symbols (`["*"]`)

**Step 4:** Time delay implementation
- Add delay queue per client
- When bar arrives:
  - If client has delay: `setTimeout(() => send(bar), delay * 1000)`
  - If real-time: send immediately
- Initial snapshot: load bars from cache with time offset

**Step 5:** Broadcasting logic
- On new bar from Redis pub/sub:
  - Iterate through connected clients
  - Check if client is subscribed to symbol
  - Apply delay if configured
  - Send bar to client

---

## Phase 4: Front Month Detection & Contract Mapping (~2-3 hours)

**Goal:** Map root symbols to current contract and group contracts for frontend selection

### Features

#### 1. Front Month Detection (Date-Based)
- **NOT volume-based** (simpler, deterministic)
- Use contract builder logic to determine current contract
- For quarterly (US indices): Current quarter based on date
  - Jan-Mar → H (Mar)
  - Apr-Jun → M (Jun)
  - Jul-Sep → U (Sep)
  - Oct-Dec → Z (Dec)
- For monthly (if needed): Current month based on date

#### 2. Root Symbol Mapping
- Map root symbol to current front month contract
- Example: `ES` → `ESZ25` (if current quarter is Dec 2025)

#### 3. Contract Grouping for Frontend
- Given a root symbol (e.g., `ES`), return all available contracts
- Enable frontend dropdown to switch between contracts
- Example:
```json
{
  "root": "ES",
  "assetClass": "us_indices",
  "frontMonth": "ESZ25",
  "contracts": [
    { "symbol": "ESZ25", "month": "Z", "year": 2025, "isFrontMonth": true },
    { "symbol": "ESH26", "month": "H", "year": 2026, "isFrontMonth": false },
    { "symbol": "ESM26", "month": "M", "year": 2026, "isFrontMonth": false },
    { "symbol": "ESU26", "month": "U", "year": 2026, "isFrontMonth": false }
  ]
}
```

#### 4. Asset Class Grouping
- Group symbols by asset class:
  - `us_indices`: ES, NQ, YM, RTY
  - `metals`: GC, SI, HG, PL, PA, MGC
  - (future: softs, energies, grains, treasuries)
- Use existing `Tickers` utility and asset class metadata

### Implementation Steps

**Step 1:** Create contract mapper utility
- File: `src/servers/edge/utils/contract_mapper.ts`
- Parse symbol to extract root, month code, year
- Example: `ESZ25` → `{ root: "ES", month: "Z", year: 2025 }`

**Step 2:** Front month detection
- Use `quarterlyBuilder` logic (from `utils/cbs/quarterly_cb.ts`)
- Determine current quarter/month based on `new Date()`
- Map root symbol to front month contract

**Step 3:** Contract grouping
- Load all symbols from cache
- Group by root symbol
- Annotate with `isFrontMonth` flag
- Sort by year, then month

**Step 4:** Asset class grouping
- Use `Tickers` utility to load asset class metadata
- Group contracts by asset class
- Expose via REST API and WebSocket

**Step 5:** Integration with REST API
- Update `/contracts/:root` endpoint (from Phase 2)
- Add `/front-month/:root` endpoint
- Example: `GET /front-month/ES` → `{ symbol: "ESZ25", ... }`

---

## Roll Period Management (Backburner)

**Not implementing now, but planned for future:**
- Detect when both front month and next month are actively trading
- Identify roll period (e.g., 5 days before expiry)
- Provide both contracts to frontend during roll
- Gradual transition from old to new contract

**Why backburner?**
- Complex (requires volume tracking or heuristics)
- Front month detection is sufficient for MVP
- Can add later when needed

---

## File Structure

```
src/servers/edge/
├── index.ts                        # Entry point
├── data/
│   ├── bar_cache.ts               # ✅ In-memory cache
│   └── redis_client.ts            # ✅ Redis connection + pub/sub
├── api/
│   └── rest.ts                    # Phase 2: REST API
├── ws/
│   ├── server.ts                  # Phase 3: WebSocket server
│   └── client_manager.ts          # Phase 3: Client connection tracking
└── utils/
    ├── contract_mapper.ts         # Phase 4: Symbol parsing
    └── front_month.ts             # Phase 4: Front month detection
```

---

## Configuration (`.env`)

```bash
# Edge Server Ports
EDGE_REST_PORT=3002
EDGE_WS_PORT=3003

# Redis (shared with Hub)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Testing Strategy

### Phase 2 Testing (REST API)

**Start Hub + Edge:**
```bash
# Terminal 1
npm run run:hub

# Terminal 2
npm run run:edge
```

**Test endpoints:**
```bash
curl http://localhost:3002/health | jq
curl http://localhost:3002/bars/latest | jq
curl http://localhost:3002/symbols | jq
curl http://localhost:3002/symbols/grouped | jq
curl http://localhost:3002/contracts/ES | jq
curl http://localhost:3002/bars/history/ESZ25?limit=10 | jq
```

### Phase 3 Testing (WebSocket)

**Test with `wscat`:**
```bash
npm install -g wscat
wscat -c ws://localhost:3003

# Subscribe to specific symbols
> {"action":"subscribe","symbols":["ESZ25","NQZ25"]}

# Request 15-min delay
> {"action":"connect","delay":900}

# Observe real-time bars
< {"symbol":"ESZ25","close":4500.5,...}
```

### Phase 4 Testing (Front Month)

**Test front month detection:**
```bash
curl http://localhost:3002/front-month/ES | jq
curl http://localhost:3002/front-month/GC | jq

# Verify it matches contract builder logic
# Check that front month changes with date
```

---

## Success Metrics

### Phase 2 Complete When:
- ✅ All REST endpoints respond correctly
- ✅ Symbol grouping by asset class works
- ✅ Contract grouping by root symbol works
- ✅ Health endpoint shows cache stats
- ✅ No linter errors

### Phase 3 Complete When:
- ✅ WebSocket server accepts connections
- ✅ Clients can subscribe to specific symbols
- ✅ Time-delayed streaming works (15-min delay tested)
- ✅ Bars broadcast to subscribed clients only
- ✅ Initial snapshot respects time delay

### Phase 4 Complete When:
- ✅ Front month detection matches contract builder logic
- ✅ Root symbols map to correct front month
- ✅ Contract grouping includes all available contracts
- ✅ Asset class grouping works for all classes
- ✅ Frontend can query available contracts for a root

---

## Key Design Decisions

### 1. Front Month by Date (Not Volume)
**Why?** Simpler, deterministic, no need to track volume across contracts.  
**Trade-off:** Might not match market convention exactly, but good enough for MVP.

### 2. Time-Delayed Streaming (Emulated Real-Time)
**Why?** Allows testing and demo without live market access.  
**Implementation:** Use setTimeout to delay bars, not batch refresh.  
**Trade-off:** Requires more memory (queue delayed bars per client).

### 3. Default: All Symbols
**Why?** Simplifies client setup, most clients will want all data.  
**Implementation:** `symbols: ["*"]` means all symbols.

### 4. Symbol Subscription at Symbol Level (Not Root Level)
**Why?** More flexibility, client controls exactly which contracts to receive.  
**Trade-off:** Client must know contract symbols, not just roots (Phase 4 helps with this).

---

## Next Steps

**Immediate:**
1. Implement Phase 2 (REST API)
2. Test all endpoints
3. Update docs with progress

**Short-term:**
1. Implement Phase 3 (WebSocket Server)
2. Test time-delayed streaming
3. Verify subscription filtering

**Medium-term:**
1. Implement Phase 4 (Front Month Detection)
2. Test contract grouping
3. Integrate with frontend

---

## Open Questions

**Q1: Should time delay be per-client or server-wide?**
- **Answer:** Per-client (more flexible, supports multiple users with different delays)

**Q2: How to handle symbol subscription for root symbols?**
- **Answer:** Phase 4 will provide mapping, client subscribes to contracts (ESZ25) not roots (ES)

**Q3: Should Edge validate bars from Redis?**
- **Answer:** No, trust Hub (Phase 1 decision, still valid)

**Q4: How far back should time delay support go?**
- **Answer:** Limited by Redis cache (10,000 bars per symbol). For 1-sec bars, that's ~2.7 hours. For 1-min bars, that's ~7 days.

**Q5: Should Edge support multiple asset classes from the start?**
- **Answer:** Yes, use existing `Tickers` utility and asset class metadata from Hub.

---

## Documentation Updates

- ✅ Updated `edge-phase1-redis.md` with new phase plan
- ✅ Created `edge-implementation-plan.md` (this file)
- 🔄 Update `system-overview.md` with Edge phases (next)
- 🔄 Update `architecture.md` with Edge details (next)

