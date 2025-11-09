# Futures Contract Management

## Problem

Futures contracts expire and roll to new contracts. The system must handle:
- Contract expiration (quarterly or monthly depending on asset)
- Automatic subscription updates as contracts change
- Multiple active contracts during roll periods

## Architecture

### Hub Server (Current Implementation)
**Role:** Subscribe to all relevant contract data from Polygon

**Implemented:**
- Dynamic contract builders (US indices, metals)
- Automated monthly subscription refresh
- Configurable contract counts
- No front month logic (raw data only)

### Edge Server (Future)
**Role:** Add intelligence for user-facing features

**Planned:**
- Front month detection (by volume)
- User-friendly symbol mapping (ES → ESZ25)
- Continuous price series for charts

---

## Implementation

### Contract Builders

**US Indices** (`src/utils/cbs/us_indices_cb.ts`)
- Quarterly contracts: H (Mar), M (Jun), U (Sep), Z (Dec)
- Determines current quarter from date
- Generates N quarters ahead (configurable)
- Example: `buildQuarterlyRequest('A', 1)` → ESZ25, NQZ25, YMZ25, RTYZ25

**Metals** (`src/utils/cbs/metals_cb.ts`)
- Monthly contracts: All 12 months (F, G, H, J, K, M, N, Q, U, V, X, Z)
- Example: `buildMonthlyRequest('A', 1)` → GCX25, SIX25, HGX25, PLX25, PAX25, MGCX25

**Configuration** (`src/config/subscriptions.ts`)
```typescript
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 1,  // 1 = current, 2 = current + next
  METALS_MONTHS: 1,
} as const;
```

---

## Subscription Refresh

### Problem
Contract subscriptions built at startup become stale after the first roll period (1 month for metals, 1 quarter for indices).

### Solution
Automated monthly cron job (`MonthlySubscriptionJob`) refreshes subscriptions:
- Schedule: 1st of month @ 00:05 ET
- Quarterly check for indices (Mar/Jun/Sep/Dec only)
- Monthly check for metals (every month)
- Zero downtime, WS stays connected

### How It Works
1. Calculate new contract symbols using builders
2. Compare with current subscriptions (by asset class metadata)
3. Unsubscribe from old if changed
4. Subscribe to new
5. Log changes to Redis

### Features
- Partial success handling (some assets can fail)
- Status persistence across restarts
- Manual trigger via `POST /admin/refresh-subscriptions`
- Health endpoint includes refresh job status

---

## Current Status

Phase 1 complete:
- US indices (quarterly) and metals (monthly) contract builders
- Automated subscription refresh (monthly cron job)
- Configurable contract counts via `SUBSCRIPTION_CONFIG`
- Status persistence across restarts

Next: Multi-asset expansion (softs, energies, grains, treasuries)

## Related Documentation

- [system-overview.md](./system-overview.md) - Complete roadmap
- [architecture.md](./architecture.md) - Technical details
- [subscription-refresh-implementation.md](./subscription-refresh-implementation.md) - Implementation details

