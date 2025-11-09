# Subscription Refresh Implementation Plan

## Status: ✅ **IMPLEMENTATION COMPLETE** (Steps 1-3 done)

## Goal
Implement automated monthly subscription refresh to prevent stale contract subscriptions without requiring Hub restarts.

## Summary of Changes

### **Core Features Implemented:**

1. **Smart Subscription Management** (`PolygonWSClient`)
   - `getSubscriptions()` - Inspect current subscriptions
   - `unsubscribe()` - Remove subscriptions (idempotent)
   - `updateSubscription()` - Atomic update with retry logic (3 attempts)

2. **Asset Class Metadata** (`PolygonWsRequest`)
   - Added optional `assetClass` field to track subscription type
   - Builders now include metadata: `us_indices`, `metals`
   - Enables smart comparison without regex pattern matching

3. **Configurable Contract Counts** (`SUBSCRIPTION_CONFIG`)
   - `US_INDICES_QUARTERS` - Default: 1 (current quarter only)
   - `METALS_MONTHS` - Default: 1 (current month only)
   - Change in one place to adjust all subscriptions

4. **Monthly Subscription Job** (`MonthlySubscriptionJob`)
   - Runs 1st of month @ 00:05 ET
   - Quarterly check: Refreshes indices only in Mar/Jun/Sep/Dec
   - Monthly check: Always refreshes metals
   - Partial success: Marks success if any asset class succeeds
   - Detailed tracking: Per asset class, per event type results

5. **Admin API Endpoints**
   - `GET /health` - Includes refresh job status
   - `GET /admin/subscriptions` - Inspect current subscriptions
   - `POST /admin/refresh-subscriptions` - Manual trigger

### **Testing:**
- Manual trigger via API: ✅ Available
- Automated scheduling: ✅ Configured
- Step 4 (comprehensive testing): 🔄 **Next**

---

## Phase 1: Add Subscription Management to PolygonWSClient

### Current State
- `PolygonWSClient` tracks subscriptions in `this.subscriptions: PolygonWsRequest[]`
- Used only for re-subscribing after reconnect
- No way to update/modify subscriptions while running

### Required Changes

#### 1.1 Add Unsubscribe Method
```typescript
async unsubscribe(request: PolygonWsRequest): Promise<void>
```

**Responsibilities:**
- Send unsubscribe message to Polygon: `{"action":"unsubscribe","params":"A.ESZ25,A.NQZ25"}`
- Remove the request from `this.subscriptions` array
- Wait for confirmation (status message)
- Log the action

**Edge cases:**
- What if already unsubscribed? (idempotent)
- What if WS disconnected? (no-op, clean up local state)
- What if unsubscribe fails? (retry logic)

#### 1.2 Add Update Subscription Method
```typescript
async updateSubscription(old: PolygonWsRequest, new: PolygonWsRequest): Promise<void>
```

**Responsibilities:**
- Compare old vs new symbols
- If different:
  - Call `unsubscribe(old)`
  - Call `subscribe(new)`
  - Update `this.subscriptions`
- If same:
  - Log "No change needed"
  - Return early

**Why separate method:**
- Atomic operation (both unsubscribe + subscribe)
- Cleaner API for refresh job
- Easier to add retry logic

#### 1.3 Add Get Current Subscriptions Method
```typescript
getSubscriptions(): PolygonWsRequest[]
```

**Responsibilities:**
- Return a copy of `this.subscriptions`
- Used by refresh job to compare current vs new

---

## Phase 2: Create MonthlySubscriptionJob

### 2.1 Job Structure
```typescript
// src/jobs/refresh_subscriptions.ts

interface RefreshJobStatus {
  lastRunTime: number | null;
  lastSuccess: boolean;
  lastError: string | null;
  lastRefreshDetails: {
    assetClass: string;
    oldSymbols: string[];
    newSymbols: string[];
    changed: boolean;
  }[];
  totalRuns: number;
}

class MonthlySubscriptionJob {
  private status: RefreshJobStatus;
  private wsClient: PolygonWSClient;
  
  constructor(wsClient: PolygonWSClient) { }
  
  async loadStatus(): Promise<void> { }
  private async saveStatus(): Promise<void> { }
  
  async runRefresh(): Promise<void> { }
  
  private shouldRefreshIndices(): boolean { }
  private shouldRefreshMetals(): boolean { }
  
  getStatus(): RefreshJobStatus { }
  
  schedule(): void { }
}

export const monthlySubscriptionJob = new MonthlySubscriptionJob(polygonClient);
```

### 2.2 Schedule Logic

**Cron Expression:**
```typescript
// Run at 00:05 ET on the 1st of every month
cron.schedule('5 0 1 * *', async () => {
  await this.runRefresh();
}, {
  timezone: 'America/New_York'
});
```

**Why 00:05?**
- After midnight, ensure date logic is correct
- Before 02:00 daily clear job
- Markets closed, minimal impact

### 2.3 Refresh Logic Flow

```
runRefresh() {
  ├─ Check if indices need refresh (Mar/Jun/Sep/Dec only)
  │  ├─ If yes:
  │  │  ├─ Build new request: usIndicesBuilder.buildQuarterlyRequest('A', 1)
  │  │  ├─ Get current request from wsClient
  │  │  ├─ Compare symbols
  │  │  ├─ If different: wsClient.updateSubscription(old, new)
  │  │  └─ Log change
  │  └─ If no: log "No refresh needed"
  │
  ├─ Check metals (every month)
  │  ├─ Build new request: metalsBuilder.buildMonthlyRequest('A', 1)
  │  ├─ Get current request from wsClient
  │  ├─ Compare symbols
  │  ├─ If different: wsClient.updateSubscription(old, new)
  │  └─ Log change
  │
  ├─ Update status and save to Redis
  └─ Log summary
}
```

### 2.4 Comparison Logic

**Problem:** How to identify which `PolygonWsRequest` in `this.subscriptions` to update?

**Solution:** Match by event type and asset class pattern

```typescript
private findSubscriptionByPattern(
  subscriptions: PolygonWsRequest[], 
  pattern: RegExp
): PolygonWsRequest | undefined {
  return subscriptions.find(sub => 
    sub.symbols.some(sym => pattern.test(sym))
  );
}

// Usage:
const indicesPattern = /^(ES|NQ|YM|RTY)[HMUZ]\d{2}$/;
const metalsPattern = /^(GC|SI|HG|PL|PA|MGC)[FGHJKMNQUVXZ]\d{2}$/;

const currentIndicesSub = this.findSubscriptionByPattern(current, indicesPattern);
```

---

## Phase 3: Admin API Integration

### 3.1 Add Manual Trigger Endpoint

```typescript
// src/servers/hub/api.ts

app.post('/admin/refresh-subscriptions', async (req, res) => {
  try {
    await monthlySubscriptionJob.runRefresh();
    const status = monthlySubscriptionJob.getStatus();
    res.json({ 
      message: 'Manual refresh triggered', 
      status 
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Refresh failed', 
      details: err.message 
    });
  }
});
```

### 3.2 Update Health Endpoint

```typescript
app.get('/health', async (req, res) => {
  const redisStats = await redisStore.getStats();
  const symbols = flowStore.getSymbols();
  const clearJobStatus = dailyClearJob.getStatus();
  const refreshJobStatus = monthlySubscriptionJob.getStatus(); // NEW

  res.json({
    status: 'ok',
    timestamp: Date.now(),
    symbols: symbols,
    symbolCount: symbols.length,
    redis: redisStats,
    dailyClearJob: clearJobStatus,
    subscriptionRefreshJob: refreshJobStatus, // NEW
  });
});
```

---

## Phase 4: Hub Integration

### 4.1 Update Hub Index

```typescript
// src/servers/hub/index.ts

import { monthlySubscriptionJob } from '@/jobs/refresh_subscriptions.js';

// ... existing code ...

// Load persisted job statuses
await dailyClearJob.loadStatus();
await monthlySubscriptionJob.loadStatus(); // NEW

// Schedule jobs
dailyClearJob.schedule();
monthlySubscriptionJob.schedule(polygonClient); // NEW, pass WS client

// ... rest of code ...
```

### 4.2 Graceful Shutdown (Future)

```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await polygonClient.disconnect();
  await redisStore.redis.quit();
  process.exit(0);
});
```

---

## Implementation Steps (Ordered)

### Step 1: Enhance PolygonWSClient (~1-2 hours) ✅ **COMPLETE**
1. ✅ Add `unsubscribe()` method
2. ✅ Add `updateSubscription()` method with retry logic
3. ✅ Add `getSubscriptions()` method
4. ✅ Add `/admin/subscriptions` endpoint for inspection

**Validation:**
- ✅ Can unsubscribe from a symbol
- ✅ Can see subscription removed from `this.subscriptions`
- ✅ Re-subscribe works correctly
- ✅ Manual testing via API completed

---

### Step 2: Create MonthlySubscriptionJob (~2-3 hours) ✅ **COMPLETE**
1. ✅ Created `src/jobs/refresh_subscriptions.ts`
2. ✅ Implemented `RefreshJobStatus` interface with detailed tracking
3. ✅ Implemented `runRefresh()` with logging and error handling
4. ✅ Added asset class metadata to `PolygonWsRequest`
5. ✅ Created `SUBSCRIPTION_CONFIG` for easy contract count changes
6. ✅ Added comparison logic using asset class metadata
7. ✅ Added `schedule()` with cron (1st of month @ 00:05 ET)
8. ✅ Added partial success handling (marks success if any refresh succeeds)

**Validation:**
- ✅ Job scheduled with cron
- ✅ Detects quarterly vs monthly refresh needs
- ✅ Logs correctly to console and Redis
- ✅ `/admin/refresh-subscriptions` manual trigger available
- ✅ Health endpoint includes refresh job status

---

### Step 3: Integration (~1 hour) ✅ **COMPLETE**
1. ✅ Wired up job in `hub/index.ts`
2. ✅ Added `/admin/refresh-subscriptions` endpoint
3. ✅ Updated `/health` endpoint with refresh job status
4. ✅ Job loads/saves status from Redis
5. ✅ Both jobs (daily clear + monthly refresh) integrated

**Validation:**
- ✅ Health endpoint shows refresh job status
- ✅ Manual trigger works via API
- ✅ Automated schedule configured correctly

---

### Step 4: Testing & Validation (~1-2 hours)
1. Test month-to-month transition (mock date)
2. Test quarterly transition (mock date)
3. Test reconnect after refresh (disconnect WS, verify re-subscribes to new symbols)
4. Test failure scenarios (Polygon down, Redis down)

**Validation:**
- Subscriptions update correctly on the 1st of month
- WS reconnect uses new symbols
- Errors are logged and persisted

---

## Testing Strategy

### Unit Tests
- `usIndicesBuilder.buildQuarterlyRequest()` returns correct symbols for any date
- `metalsBuilder.buildMonthlyRequest()` returns correct symbols for any date
- `shouldRefreshIndices()` returns true only for Mar/Jun/Sep/Dec

### Integration Tests
- Mock Polygon WS client
- Verify unsubscribe + subscribe messages sent
- Verify `this.subscriptions` updated correctly

### Manual Tests
1. Start Hub on Nov 1st → verify ESZ25, GCX25 subscribed
2. Trigger manual refresh → verify no change (same month)
3. Mock date to Dec 1st → trigger manual refresh → verify GCZ25 subscribed, GCX25 unsubscribed
4. Mock date to Mar 1st → trigger manual refresh → verify ESH26 subscribed, ESZ25 unsubscribed

---

## Open Questions

### Q1: Should we keep old subscriptions during a buffer period?
**Context:** Traders roll positions 1-2 weeks before expiration. Should we subscribe to both old and new contracts during transition?

**Options:**
- A: Subscribe only to new contract (current plan)
- B: Subscribe to current + next contract (2 quarters/months)
- C: Detect roll period and subscribe to both temporarily

**Recommendation:** Start with A (simple), add B later if needed.

---

### Q2: What if refresh fails?
**Context:** Polygon API down, network issue, etc.

**Options:**
- A: Retry with exponential backoff (up to 5 attempts)
- B: Alert and wait for next scheduled run
- C: Keep retrying until success

**Recommendation:** A - Retry 3 times with 1min/5min/15min delays, then give up and alert.

---

### Q3: How to handle Hub restarts mid-month?
**Context:** Hub restarts on Dec 15th. Should it wait until Jan 1st to refresh, or refresh immediately?

**Options:**
- A: Refresh on startup if current contracts don't match expected (smart)
- B: Wait for next scheduled run (simple)

**Recommendation:** B for now (simple), add A later for robustness.

---

## Success Metrics

1. **Zero Downtime:** Hub runs continuously without manual restarts
2. **Fresh Subscriptions:** Symbols update automatically on the 1st of each month/quarter
3. **Observable:** Health endpoint shows last refresh time and status
4. **Reliable:** Retry logic handles transient failures
5. **Testable:** Can manually trigger refresh for validation

---

## Next Actions

1. Read through this plan with the user
2. Confirm approach and answer open questions
3. Start with Step 1: Enhance PolygonWSClient
4. Implement a few lines at a time, test incrementally

