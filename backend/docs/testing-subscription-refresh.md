# Testing Subscription Refresh

## Quick Start

### 1. Start the Hub

```bash
cd /home/david/dev/mk3/backend
npx tsx src/servers/hub/index.ts
```

You should see:
```
Connecting to Polygon futures...
Subscribing to: A.ESZ25,A.NQZ25,A.YMZ25,A.RTYZ25
Subscribing to: A.HGX25,A.GCX25,A.SIX25,A.PLX25,A.PAX25,A.MGCX25
Daily clear job scheduled (2 AM ET)
Monthly subscription refresh job scheduled (1st of month @ 00:05 ET)
Hub REST API listening on port 3001
```

---

## 2. Test Health Endpoint

```bash
curl http://localhost:3001/health | jq
```

Expected output includes:
```json
{
  "status": "ok",
  "subscriptionRefreshJob": {
    "lastRunTime": null,
    "lastSuccess": false,
    "lastError": null,
    "lastRefreshDetails": [],
    "totalRuns": 0
  }
}
```

---

## 3. Check Current Subscriptions

```bash
curl http://localhost:3001/admin/subscriptions | jq
```

Expected output:
```json
{
  "subscriptions": [
    {
      "ev": "A",
      "symbols": ["ESZ25", "NQZ25", "YMZ25", "RTYZ25"],
      "assetClass": "us_indices"
    },
    {
      "ev": "A",
      "symbols": ["HGX25", "GCX25", "SIX25", "PLX25", "PAX25", "MGCX25"],
      "assetClass": "metals"
    }
  ],
  "count": 2,
  "totalSymbols": 10
}
```

---

## 4. Manual Trigger Test

```bash
curl -X POST http://localhost:3001/admin/refresh-subscriptions | jq
```

**Expected behavior (November 2025):**
- US Indices: No change (not a quarterly month)
- Metals: No change (already on November contracts)

Expected output:
```json
{
  "message": "Manual subscription refresh triggered",
  "status": {
    "lastRunTime": 1731182400000,
    "lastSuccess": true,
    "lastError": null,
    "lastRefreshDetails": [
      {
        "assetClass": "metals",
        "eventType": "A",
        "oldSymbols": ["HGX25", "GCX25", "SIX25", "PLX25", "PAX25", "MGCX25"],
        "newSymbols": ["HGX25", "GCX25", "SIX25", "PLX25", "PAX25", "MGCX25"],
        "changed": false,
        "success": true
      }
    ],
    "totalRuns": 1
  }
}
```

**Console output should show:**
```
--- MonthlySubscriptionJob ---
Running subscription refresh job...
US Indices: No refresh needed (not a quarterly month)
Metals: Refresh needed (monthly check)
[metals/A] No change needed
✓ Refresh completed successfully
Summary: 1/1 successful, 0 changed
```

---

## 5. Test Contract Count Changes

### Change Subscription Configuration

Edit `backend/src/config/subscriptions.ts`:
```typescript
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 2,  // Changed from 1
  METALS_MONTHS: 2,         // Changed from 1
} as const;
```

### Restart Hub

```bash
# Stop current process (Ctrl+C)
npx tsx src/servers/hub/index.ts
```

### Verify New Subscriptions

```bash
curl http://localhost:3001/admin/subscriptions | jq '.totalSymbols'
```

Expected: ~20 symbols (4 indices × 2 quarters + 6 metals × 2 months)

---

## 6. Simulate Month Change

### Option A: Wait for December 1st
The job will automatically run at 00:05 ET on Dec 1st.

### Option B: Manually Trigger on Dec 1st
```bash
# On December 1st, 2025
curl -X POST http://localhost:3001/admin/refresh-subscriptions | jq
```

Expected behavior:
- US Indices: No change (ESZ25 is Dec quarter, still current)
- Metals: **CHANGE** from `X25` (Nov) to `Z25` (Dec)

Expected output:
```json
{
  "lastRefreshDetails": [
    {
      "assetClass": "metals",
      "eventType": "A",
      "oldSymbols": ["HGX25", "GCX25", "SIX25", "PLX25", "PAX25", "MGCX25"],
      "newSymbols": ["HGZ25", "GCZ25", "SIZ25", "PLZ25", "PAZ25", "MGCZ25"],
      "changed": true,
      "success": true
    }
  ]
}
```

---

## 7. Simulate Quarter Change

### Option A: Wait for March 1st
The job will run and update indices from `Z25` (Dec 2025) to `H26` (Mar 2026).

### Option B: Mock Date (Advanced)
Modify `us_indices_cb.ts` temporarily:
```typescript
private getCurrentQuarter(date: Date = new Date('2026-03-01')): { month: MonthCode; year: number } {
  // Force March 2026 for testing
```

Then trigger refresh:
```bash
curl -X POST http://localhost:3001/admin/refresh-subscriptions | jq
```

Expected:
- US Indices: **CHANGE** from `Z25` to `H26`
- Metals: **CHANGE** from `Z25` to `H26`

---

## 8. Test Failure Scenarios

### Disconnect Polygon

1. Stop Polygon WS (simulate network issue)
2. Trigger refresh:
```bash
curl -X POST http://localhost:3001/admin/refresh-subscriptions | jq
```

Expected:
- Job should handle errors gracefully
- `lastSuccess: false`
- `lastError` contains error message
- Status persisted to Redis

### Check Status After Restart

```bash
# Restart Hub
npx tsx src/servers/hub/index.ts

# Check if status persisted
curl http://localhost:3001/health | jq '.subscriptionRefreshJob'
```

Should show previous run's status (loaded from Redis).

---

## 9. Monitor Logs

Watch console for refresh activity:
```
--- MonthlySubscriptionJob ---
Running subscription refresh job...
US Indices: Refresh needed (quarterly month)
[us_indices/A] Symbols changed, updating subscription...
  Old: ESZ25, NQZ25, YMZ25, RTYZ25
  New: ESH26, NQH26, YMH26, RTYH26
Unsubscribing from: A.ESZ25,A.NQZ25,A.YMZ25,A.RTYZ25
Subscribing to: A.ESH26,A.NQH26,A.YMH26,A.RTYH26
✓ Subscription updated successfully
Metals: Refresh needed (monthly check)
[metals/A] Symbols changed, updating subscription...
  Old: HGX25, GCX25, SIX25, PLX25, PAX25, MGCX25
  New: HGH26, GCH26, SIH26, PLH26, PAH26, MGCH26
✓ Subscription updated successfully
✓ Refresh completed successfully
Summary: 2/2 successful, 2 changed
```

---

## Expected Cron Behavior

### November 1st @ 00:05 ET
- Indices: No change (not quarterly)
- Metals: No change (already Nov)

### December 1st @ 00:05 ET
- Indices: No change (still Dec quarter)
- Metals: Update X25 → Z25

### March 1st @ 00:05 ET
- Indices: Update Z25 → H26
- Metals: Update Z25 → H26

### June 1st @ 00:05 ET
- Indices: Update H26 → M26
- Metals: Update H26 → M26

---

## Troubleshooting

### Job not running automatically
Check cron expression and timezone:
```typescript
// In refresh_subscriptions.ts
cron.schedule('5 0 1 * *', async () => {
  await this.runRefresh();
}, {
  timezone: 'America/New_York'
});
```

### Symbols not updating
1. Check builder logic:
```bash
cd backend && npx tsx -e "
import { usIndicesBuilder } from './src/utils/cbs/us_indices_cb.js';
console.log(usIndicesBuilder.buildQuarterlyRequest('A', 1));
"
```

2. Check current date logic:
```bash
cd backend && npx tsx -e "
const now = new Date();
const month = now.getMonth() + 1;
console.log('Current month:', month);
console.log('Should refresh indices:', [3, 6, 9, 12].includes(month));
"
```

### Status not persisting
Check Redis connection:
```bash
curl http://localhost:3001/health | jq '.redis'
```

---

## Success Criteria

- ✅ Health endpoint shows refresh job status
- ✅ Manual trigger works and updates subscriptions when needed
- ✅ Job detects quarterly vs monthly refresh needs correctly
- ✅ Status persists across restarts
- ✅ Partial failures handled (some assets succeed, some fail)
- ✅ Contract count easily configurable via `SUBSCRIPTION_CONFIG`
- ✅ Logs are clear and actionable

