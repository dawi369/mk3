# Subscription Refresh Implementation

## Status

Steps 1-3 complete. System operational.

## What Was Built

### 1. Subscription Management (PolygonWSClient)

Added three methods to `ws_client.ts`:

**getSubscriptions()**
- Returns copy of current subscriptions
- Used by refresh job for comparison

**unsubscribe(request)**
- Sends unsubscribe message to Polygon
- Removes from internal tracking
- Updates subscription count
- Idempotent (safe if disconnected)

**updateSubscription(old, new)**
- Atomic operation: unsubscribe old + subscribe new
- Compares symbols before acting (skips if unchanged)
- Retry logic: 3 attempts with exponential backoff
- Logs all actions

### 2. Asset Class Metadata (Types)

Updated `PolygonWsRequest` interface:
```typescript
export type PolygonAssetClass = "us_indices" | "metals";

export interface PolygonWsRequest {
  ev: "AM" | "A";
  symbols: string[];
  assetClass?: PolygonAssetClass;  // NEW
}
```

Builders now include metadata for smart comparison.

### 3. Configurable Contract Counts

Created `config/subscriptions.ts`:
```typescript
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 1,  // 1 = current, 2 = current + next
  METALS_MONTHS: 1,
} as const;
```

Change in one place to adjust all subscriptions.

### 4. Monthly Subscription Job

Created `jobs/refresh_subscriptions.ts`:

**MonthlySubscriptionJob class:**
- `runRefresh()` - Main logic
- `schedule(wsClient)` - Cron setup (1st of month @ 00:05 ET)
- `loadStatus()` / `saveStatus()` - Redis persistence
- `getStatus()` - Current job state

**Refresh logic:**
- Quarterly check: Indices refresh only in Mar/Jun/Sep/Dec
- Monthly check: Metals refresh every month
- Finds current subscription by asset class metadata
- Compares symbols, updates if changed
- Partial success: Marks success if any asset succeeds

**Status tracking:**
```typescript
interface RefreshJobStatus {
  lastRunTime: number | null;
  lastSuccess: boolean;
  lastError: string | null;
  lastRefreshDetails: RefreshDetails[];  // Per asset class results
  totalRuns: number;
}
```

### 5. Admin API

Added to `servers/hub/api.ts`:

**GET /health**
- Now includes `subscriptionRefreshJob` status

**GET /admin/subscriptions**
- Inspect current WS subscriptions

**POST /admin/refresh-subscriptions**
- Manual trigger for testing/emergency

### 6. Hub Integration

Updated `servers/hub/index.ts`:
- Load refresh job status on startup
- Schedule cron job
- Pass WS client to job

## Testing

### Manual Trigger
```bash
curl -X POST http://localhost:3001/admin/refresh-subscriptions | jq
```

### Check Status
```bash
curl http://localhost:3001/health | jq '.subscriptionRefreshJob'
```

### View Current Subscriptions
```bash
curl http://localhost:3001/admin/subscriptions | jq
```

## How It Works

### Startup
1. Hub loads persisted job status from Redis
2. Schedules cron job (1st of month @ 00:05 ET)
3. Job runs automatically on schedule

### Monthly Run
1. Check if indices need refresh (Mar/Jun/Sep/Dec only)
2. Check metals (always)
3. For each asset class:
   - Build new request using builder
   - Find current subscription by asset class
   - Compare symbols
   - Update if changed
4. Save status to Redis
5. Log summary

### Manual Run
Same logic as automated, triggered via API endpoint.

## Implementation Details

### Finding Current Subscriptions
```typescript
private findSubscriptionByAssetClass(
  subscriptions: PolygonWsRequest[],
  assetClass: PolygonAssetClass,
  eventType: 'A' | 'AM'
): PolygonWsRequest | undefined {
  return subscriptions.find(
    sub => sub.assetClass === assetClass && sub.ev === eventType
  );
}
```

No regex needed - uses asset class metadata.

### Partial Success Handling
```typescript
const anySuccess = results.some(r => r.success);
const anyFailure = results.some(r => !r.success);

if (anyFailure) {
  status.lastSuccess = anySuccess;  // Partial success
  status.lastError = errors.join('; ');
} else {
  status.lastSuccess = true;
  status.lastError = null;
}
```

### Status Persistence
```typescript
// Save after each run
await redisStore.redis.set('job:refresh:status', JSON.stringify(this.status));

// Load on startup
const saved = await redisStore.redis.get('job:refresh:status');
if (saved) {
  this.status = JSON.parse(saved);
}
```

## Files Modified

**New:**
- `config/subscriptions.ts`
- `jobs/refresh_subscriptions.ts`

**Modified:**
- `utils/types.ts` - Added `PolygonAssetClass`, updated `PolygonWsRequest`
- `utils/cbs/us_indices_cb.ts` - Added `assetClass: 'us_indices'`
- `utils/cbs/metals_cb.ts` - Added `assetClass: 'metals'`
- `utils/consts.ts` - Uses `SUBSCRIPTION_CONFIG`
- `api/polygon/ws_client.ts` - Added subscription management methods
- `servers/hub/api.ts` - Added endpoints, updated health
- `servers/hub/index.ts` - Integrated refresh job

## Configuration

To change contract counts, edit `config/subscriptions.ts` and restart Hub.

For roll coverage, set both to `2`:
```typescript
US_INDICES_QUARTERS: 2,  // Current + next
METALS_MONTHS: 2,         // Current + next
```

## Monitoring

Check job status in health endpoint:
```bash
curl http://localhost:3001/health | jq '.subscriptionRefreshJob'
```

Expected fields:
- `lastRunTime` - Timestamp of last run
- `lastSuccess` - Boolean
- `lastError` - Error string or null
- `lastRefreshDetails` - Array of per-asset results
- `totalRuns` - Count of all runs

## Next Steps

Comprehensive testing:
1. Test month-to-month transition (mock date to Dec 1st)
2. Test quarterly transition (mock date to Mar 1st)
3. Test reconnect after refresh
4. Test failure scenarios (Polygon down, Redis down)
