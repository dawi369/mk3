# Futures Contract Management Strategy

## The Problem

Futures contracts are not like stocks — they expire and roll to new contracts. This creates challenges:

### **Key Challenges**
1. **Expiration** - Contracts expire quarterly (H=Mar, M=Jun, U=Sep, Z=Dec)
2. **Rolling** - Traders roll positions 1-2 weeks before expiration
3. **Multiple Active** - During roll periods, both front and next month are liquid
4. **User Expectations** - Users want "ES" (not "ESZ25"), system should handle contracts automatically
5. **Historical Continuity** - Charts need seamless data across contract rolls
6. **Data Availability** - New contracts become available months before they're front month

### **Example Timeline**
```
Nov 2025: ESZ25 is front month (expires Dec 20)
Dec 2025: ESZ25 rolls to ESH26 (Mar 2026)
    ↓
During roll (Dec 1-15):
  - Both ESZ25 and ESH26 trade actively
  - Volume shifts from Z25 → H26
  - Users need both contracts visible
  - System must prepare for switch
```

---

## Architecture: Hub vs Edge Responsibilities

### **Hub Server (Raw Data Provider)**
**Role:** Subscribe to and distribute ALL relevant contract data from Polygon

**Responsibilities:**
- ✅ Subscribe to current quarter + future quarters (1 year ahead)
- ✅ Provide raw bar data for all contracts
- ✅ No intelligence about "front month" or rolling
- ✅ Just pipes Polygon data to storage (Redis/flowStore)

**Why:** Keep Hub simple, dumb, and fast. It's a data firehose.

---

### **Edge Server (Smart Data Layer)**
**Role:** Understand contract lifecycle and serve user-friendly data

**Responsibilities:**
- 🔄 Determine which contract is "front month" (by volume/open interest)
- 🔄 Detect roll periods (when both contracts are active)
- 🔄 Map user requests ("ES") to actual contracts ("ESZ25")
- 🔄 Provide seamless experience across rolls
- 🔄 Build continuous price series for charts
- 🔄 Handle quarter transitions automatically

**Why:** Business logic lives at Edge, closest to users.

---

## Current Implementation (Phase 1: Hub)

### **What We Built**

**File:** `src/utils/contract_builder.ts`

**Class:** `USIndicesContractBuilder`
- Takes today's date
- Determines current quarter (H, M, U, Z)
- Generates N quarters ahead (configurable)
- Builds Polygon symbols for all US indices
- Returns `PolygonWsRequest` ready for WS subscription

**Usage:**
```typescript
// Subscribe to 1 quarter (current only)
const request = usIndicesBuilder.buildQuarterlyRequest('A', 1);
// Symbols: ESZ25, NQZ25, YMZ25, ... (all US indices, current quarter)

// Subscribe to 4 quarters (1 year)
const request = usIndicesBuilder.buildQuarterlyRequest('A', 4);
// Symbols: ESZ25, ESH26, ESM26, ESU26, NQZ25, NQH26, ... (full year)
```

**Behavior:**
- ✅ Automatically determines current quarter from system date
- ✅ Generates proper Polygon symbols (root + month code + 2-digit year)
- ✅ Scales to all US indices in `tickers/us_indices.json`
- ✅ Updates on restart (picks up new quarters if date changed)

---

## Solution Roadmap

### **Phase 1: Hub — Raw Data Collection ✅ COMPLETE**

**Goal:** Subscribe to enough contracts to cover user needs (1 year ahead)

**Implemented:**
- ✅ `USIndicesContractBuilder` class
- ✅ Quarterly contract generation (current + N future)
- ✅ Dynamic symbol building from Tickers
- ✅ Configurable quarter count (1-4+)
- ✅ Integrated into Hub WS subscription

**Result:** Hub now subscribes to ESZ25 (current) and can extend to 4 quarters (full year) when needed.

**Current Config:** 1 quarter (current only) to minimize Polygon API usage during development.

---

### **Phase 2: Hub — Multi-Asset Support** 🔄 NEXT

**Goal:** Extend to all asset classes (metals, softs, currencies, volatiles)

**TODO:**
```typescript
// Add builders for other asset classes
class MetalsContractBuilder {
  // Metals trade all 12 months: F, G, H, J, K, M, N, Q, U, V, X, Z
  buildMonthlyRequest(eventType, totalMonths): PolygonWsRequest
}

class SoftsContractBuilder {
  // Softs have varying cycles (KC: H, K, N, U, Z)
  buildRequest(eventType, totalContracts): PolygonWsRequest
}
```

**Effort:** 2-3 hours per asset class

---

### **Phase 3: Edge — Front Month Intelligence** 🔜 FUTURE

**Goal:** Edge determines which contract is "front month" without Hub involvement

**How Edge Will Work:**

#### **A) Volume-Based Detection**
```typescript
// Edge queries Redis for all ES contracts
const esContracts = await redis.keys('bar:latest:ES*');

// Get volume for each
const volumes = await Promise.all(
  esContracts.map(async key => ({
    symbol: key,
    volume: (await redis.get(key)).volume
  }))
);

// Front month = highest volume + nearest expiration
const frontMonth = volumes
  .sort((a, b) => b.volume - a.volume)
  .filter(c => daysToExpiry(c.symbol) > 0)[0];
```

#### **B) User-Friendly API**
```typescript
// User requests "ES" (root symbol)
GET /bars/latest/ES

// Edge translates to front month
→ Returns data from ESZ25 (current front)

// During roll period (both contracts active)
GET /bars/latest/ES?includeNext=true

→ Returns:
{
  "root": "ES",
  "frontMonth": {
    "symbol": "ESZ25",
    "expiresIn": 5,  // days
    "bar": { ... }
  },
  "nextMonth": {
    "symbol": "ESH26",
    "expiresIn": 95,
    "bar": { ... }
  }
}
```

#### **C) Continuous Price Series**
```typescript
// For charts: splice contracts into continuous series
GET /bars/history/ES?days=90

// Edge stitches together:
// - ESU25 (Sep contract, expired)
// - ESZ25 (Dec contract, current)
// Returns seamless price series
```

**Data Edge Needs:**
- ✅ Bar data for all contracts (Hub provides via Redis)
- ✅ Volume per contract (in bar data)
- 🔄 Expiration dates (add to contract metadata)
- 🔄 Roll calendar (when to switch front month)

---

### **Phase 4: Hub — Contract Metadata** 🔜 FUTURE

**Goal:** Provide contract lifecycle information to Edge

**Add to Hub API:**
```typescript
// New endpoint
GET /contracts/metadata/ES

Response:
{
  "root": "ES",
  "availableContracts": [
    {
      "symbol": "ESZ25",
      "month": "Z",
      "year": 2025,
      "expirationDate": "2025-12-20",
      "firstNoticeDate": "2025-12-13",
      "daysToExpiry": 42,
      "isActive": true
    },
    {
      "symbol": "ESH26",
      "month": "H",
      "year": 2026,
      "expirationDate": "2026-03-20",
      "daysToExpiry": 132,
      "isActive": true
    }
  ]
}
```

**Implementation:**
```typescript
// Store contract specs in Redis
// Update daily with expiration countdown
// Edge reads this to make front month decisions
```

---

### **Phase 5: Edge — Automated Rolling** 🔜 FUTURE

**Goal:** Edge automatically switches "front month" on roll day

**How:**
```typescript
// Daily job (runs at 2 AM with Redis clear)
async function checkForRolls() {
  for (const root of ['ES', 'NQ', 'YM', ...]) {
    const current = await getFrontMonth(root);
    const daysLeft = daysToExpiry(current.symbol);
    
    if (daysLeft <= 8) {
      // Roll period started
      const next = await getNextMonth(root);
      
      // Compare volumes
      if (next.volume > current.volume) {
        console.log(`Rolling ${root}: ${current.symbol} → ${next.symbol}`);
        await setFrontMonth(root, next.symbol);
      }
    }
  }
}
```

**Result:** Users see seamless transition from ESZ25 → ESH26 without manual intervention.

---

## User Experience Goals

### **Casual Trader (Target: 90% of users)**

**Experience:**
```
Dashboard shows: "ES 6885.50"
  ↓
System handles:
  - Determines ESZ25 is current front month
  - Fetches bar from Redis: bar:latest:ESZ25
  - Displays price without showing contract code
  - Auto-switches to ESH26 after roll
```

**User doesn't see:** Contract codes, roll dates, expiration warnings

---

### **Sophisticated Trader (Target: 10% of users)**

**Experience:**
```
Dashboard shows: "ES (Front: Z25)"
  ↓
User can:
  - Click to see all ES contracts (Z25, H26, M26, U26)
  - Compare front vs next month during roll
  - View contract expiration dates
  - Subscribe to specific contracts (not just front)
  - See calendar spreads (Z25 - H26)
```

**User sees:** Full transparency, contract-level detail, roll indicators

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────┐
│  Polygon (Upstream)                             │
│  - Provides: ESZ25, ESH26, ESM26, ESU26         │
│  - Raw tick data, no roll intelligence          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Hub (Dumb Pipe)                                │
│  - Subscribes to: Current + 3 future quarters   │
│  - Stores: bar:latest:ESZ25, bar:latest:ESH26   │
│  - No logic, just raw data distribution         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Redis (Storage)                                │
│  - Keys: bar:latest:*, bar:today:*              │
│  - Metadata: contract:front:ES = "ESZ25"        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Edge (Smart Layer)                             │
│  - Reads all ES* contracts from Redis           │
│  - Determines front month by volume             │
│  - Maps user "ES" → "ESZ25" transparently       │
│  - Handles roll transitions                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Dashboard (User)                               │
│  - Requests: GET /bars/latest/ES                │
│  - Receives: Price for front month (seamless)   │
│  - Optional: See all contracts if desired       │
└─────────────────────────────────────────────────┘
```

---

## Configuration Strategy

### **Hub Configuration** (Production Ready)

```typescript
// For live trading: Subscribe to current + 1 future quarter
const request = usIndicesBuilder.buildQuarterlyRequest('A', 2);
// Covers: Current (Z25) + Next (H26)
// Handles roll period without gaps

// For full year coverage: 4 quarters
const request = usIndicesBuilder.buildQuarterlyRequest('A', 4);
// Covers: Z25, H26, M26, U26
// Users can see prices 1 year ahead
```

**Recommendation:** Start with 2 quarters (current + next) for roll coverage, expand to 4 when users need longer horizons.

---

## Maintenance & Updates

### **When to Update**

**Manual Updates:** Never needed (system auto-detects quarters on restart)

**Restart Triggers:**
- After quarterly roll (system picks up new quarters)
- When adding new asset classes
- When Polygon adds new contracts

**Monitoring:**
```bash
# Check what's subscribed
GET /health
→ Shows symbol count, current subscriptions

# Verify contract coverage
GET /symbols
→ Lists all active symbols Hub is tracking
```

---

## Open Questions / Future Enhancements

### **Q1: How far ahead should Hub subscribe?**
- Current: 1 quarter (current only)
- Recommended: 2 quarters (handles rolls)
- Maximum: 4 quarters (full year)
- Trade-off: More contracts = more data = higher costs

### **Q2: How to handle expired contracts?**
- Hub: Keep sending data until Polygon stops (no cleanup needed)
- Edge: Filter out contracts past expiration
- Redis: Daily clear removes all (no accumulation)

### **Q3: What about thinly-traded contracts?**
- Hub: Subscribe to all (Polygon decides what to send)
- Edge: Hide contracts with zero volume
- User: Only sees liquid contracts by default

### **Q4: How to handle gaps in data?**
- Polygon sometimes drops contracts early
- Edge should detect missing data
- Fall back to previous contract if needed
- Log warnings for investigation

---

## Success Metrics

### **Phase 1 (Current): Hub Data Collection** ✅
- ✅ Hub subscribes to all needed contracts
- ✅ Data flows to Redis without gaps
- ✅ System handles quarter transitions on restart

### **Phase 2: Multi-Asset Support**
- 🎯 All asset classes supported (metals, softs, currencies)
- 🎯 Configurable contract cycles per asset class
- 🎯 Scales to 100+ underlying symbols

### **Phase 3: Edge Intelligence**
- 🎯 Users request "ES", get front month automatically
- 🎯 Roll transitions happen seamlessly
- 🎯 No manual intervention required

### **Phase 4: Production Ready**
- 🎯 1 year of contract coverage
- 🎯 Zero downtime during rolls
- 🎯 Historical continuity for charts
- 🎯 Sub-100ms API responses

---

## Timeline Estimate

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| 1 | Hub quarterly contracts | 2 hours | ✅ Done |
| 2 | Multi-asset support | 6 hours | 🔄 Next |
| 3 | Edge front month logic | 8 hours | 🔜 Future |
| 4 | Contract metadata API | 4 hours | 🔜 Future |
| 5 | Automated rolling | 6 hours | 🔜 Future |

**Total:** ~26 hours to complete full system

**Current Progress:** Phase 1 complete (8% done)

---

## Subscription Refresh Strategy

### **The Stale Subscription Problem**

**Issue:** Contract subscriptions are built at module load time and become stale over time.

**Example:**
```
Nov 1, 2025 - Hub starts, subscribes to ESZ25 (Dec contract)
Dec 1, 2025 - Still subscribed to ESZ25, but should be on ESH26 (Mar 2026)
             - Data flow stops for expired/inactive contracts
```

**Why it matters:**
- Quarterly contracts roll every 3 months (indices)
- Monthly contracts roll every month (metals)
- Static subscriptions break after the first roll period

---

### **Option 1: Monthly Hub Restart (Manual)**

**How it works:** Restart the Hub server monthly to rebuild subscriptions.

**Pros:**
- Simple, clean slate
- Forces system review
- No complex code

**Cons:**
- Manual intervention required
- Loses in-memory state
- Downtime during restart
- Not scalable for 24/7 operation

**Verdict:** ❌ Not recommended for production

---

### **Option 2: Automated Monthly Subscription Refresh Job** ⭐ **(Selected)**

**How it works:** Background job refreshes subscriptions periodically without restart.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│  MonthlySubscriptionJob (cron-based)                        │
│                                                              │
│  Schedule:                                                   │
│  - Metals: 1st of every month @ 00:05 ET                   │
│  - US Indices: 1st of Mar/Jun/Sep/Dec @ 00:05 ET          │
│                                                              │
│  Actions:                                                    │
│  1. Calculate new contract symbols (using builders)         │
│  2. Compare with current subscriptions                      │
│  3. Unsubscribe from old symbols (if changed)              │
│  4. Subscribe to new symbols                                │
│  5. Update internal subscription tracking                   │
│  6. Log changes to Redis for observability                  │
└─────────────────────────────────────────────────────────────┘
```

**Timeline Example (November → December):**

```
Nov 1, 2025 00:00
  ├─ Hub starts
  ├─ Builds subscriptions: ESZ25, GCX25, ... (current contracts)
  ├─ Connects to Polygon WS
  └─ Starts receiving data

Nov 1, 2025 02:00
  └─ Daily clear job runs (clears Oct 31 data)

... (29 days of normal operation) ...

Dec 1, 2025 00:05
  ├─ Monthly subscription refresh job runs
  ├─ US Indices: No change (ESZ25 still current quarter)
  ├─ Metals: Change detected!
  │   ├─ Old: GCX25 (Nov) → New: GCZ25 (Dec)
  │   ├─ Unsubscribe: GCX25, SIX25, HGX25, ...
  │   ├─ Subscribe: GCZ25, SIZ25, HGZ25, ...
  │   └─ Update tracking: last_refresh_metals=2025-12-01
  └─ Log: "Refreshed metals subscriptions: 6 symbols updated"

Dec 1, 2025 02:00
  └─ Daily clear job runs (clears Nov 30 data)

... (continues indefinitely) ...

Mar 1, 2026 00:05
  ├─ Monthly subscription refresh job runs
  ├─ US Indices: Change detected!
  │   ├─ Old: ESZ25 (Dec 2025) → New: ESH26 (Mar 2026)
  │   ├─ Unsubscribe: ESZ25, NQZ25, ...
  │   ├─ Subscribe: ESH26, NQH26, ...
  │   └─ Update tracking: last_refresh_indices=2026-03-01
  └─ Metals: Updated to GCH26, SIH26, ... (Mar contracts)
```

**Key Features:**

1. **Zero Downtime**
   - Hub keeps running
   - WS connection stays alive
   - API remains available
   - flowStore/Redis continue operating

2. **Smart Detection**
   - Only refreshes if symbols actually changed
   - Prevents unnecessary unsubscribe/resubscribe cycles
   - Logs when no refresh needed

3. **Data Continuity**
   - Old symbols: stop receiving data naturally (expired)
   - New symbols: start flowing in immediately
   - Symbol-based keys in stores handle transition automatically
   - No data corruption or loss

4. **Observability**
   - Track last refresh time per asset class in Redis
   - Log all subscription changes
   - Include refresh status in `/health` endpoint
   - Alert if refresh fails

5. **Manual Override**
   - `POST /admin/refresh-subscriptions` endpoint
   - Useful for testing or emergency fixes
   - Same logic as automated job

**Implementation Phases:**

| Phase | Component | Description | Effort |
|-------|-----------|-------------|--------|
| 1 | `PolygonWSClient` | Add subscription management methods | 2 hours |
| 2 | `MonthlySubscriptionJob` | Create cron job with refresh logic | 3 hours |
| 3 | Admin API | Add manual trigger endpoint | 1 hour |
| 4 | Monitoring | Add metrics and alerts | 2 hours |

**Total Effort:** ~8 hours

---

### **Option 3: Lazy/On-Demand Refresh**

**How it works:** Detect stale subscriptions by monitoring data flow, refresh when needed.

**Pros:**
- Only refreshes when actually needed
- Could detect issues automatically

**Cons:**
- Complex detection logic
- Harder to debug
- Might miss roll window
- Risk of data gaps

**Verdict:** ❌ Too complex for marginal benefit

---

### **Selected Approach: Option 2**

**Why:**
- ✅ Predictable, runs on schedule
- ✅ Zero downtime
- ✅ Fully automated
- ✅ Observable and debuggable
- ✅ Scales to 24/7 operation
- ✅ Manual override available

**Trade-offs accepted:**
- Runs on calendar dates, not market-aware dates (acceptable for 1-month/quarter buffers)
- Requires cron job management (already have `DailyClearJob` pattern)

---

## Conclusion

**Current State:** Hub successfully subscribes to US indices and metals contracts with dynamic builders.

**Critical Gap:** Subscriptions are static at startup and become stale after first roll period.

**Solution:** Implement automated monthly subscription refresh job (Option 2).

**Next Steps:** 
1. ✅ Phase 1 & 2 Complete: Dynamic contract builders (US indices, metals)
2. 🔄 **Now**: Add subscription refresh mechanism
3. 🔜 Build Edge server with front month intelligence
4. 🔜 Add continuous contract data for charting

**Long-term Vision:** Users interact with root symbols ("ES"), system handles all contract complexity behind the scenes with zero manual intervention.

