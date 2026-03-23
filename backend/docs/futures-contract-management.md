# Futures Contract Management

## Problem

Futures contracts expire and roll to new contracts. The system must handle:
- Contract expiration (quarterly or monthly depending on asset)
- Automatic subscription updates when contracts change

## Solution

### Contract Builders (`src/utils/cbs/schedule_cb.ts`)

Uses active-contract discovery first and only falls back to static month-code generation if the contracts endpoint does not return usable data:

```typescript
const request = await scheduleBuilder.buildRequestAsync("us_indices", "A");
// Returns: { ev: "A", symbols: ["ESH6", "NQH6", ...], assetClass: "us_indices" }
```

### Front-Month Resolution (`src/jobs/front_month_job.ts`)

Front month is resolved from:

1. active contracts for a product root
2. per-contract snapshot liquidity signals
3. nearest valid expiry as fallback

The resolver ranks candidates by session volume, then open interest, then expiry proximity. This is more robust than assuming the first calendar contract is always the front month.

### Supported Asset Classes

| Asset Class | Cycle | Products |
|-------------|-------|----------|
| `us_indices` | Quarterly (H, M, U, Z) | ES, NQ, YM, RTY |
| `metals` | Quarterly | GC, SI, HG, PL, PA, MGC |
| `currencies` | Quarterly | 6E, 6J, 6B, 6C, 6A, 6S |
| `grains` | Monthly | ZC, ZW, ZS, ZM, ZL |
| `softs` | Monthly | KC, CT, SB, CC, OJ, TT |
| `volatiles` | Monthly | VX |

## Subscription Refresh

Monthly cron job (`refresh_subscriptions.ts`) handles updates:

- **Schedule:** 1st of month @ 00:05 ET
- **Logic:** Rebuilds requests from currently active contracts, compares with active subscriptions
- **Zero downtime:** WS stays connected during update

### Manual Trigger

```bash
curl -X POST http://localhost:3001/admin/refresh-subscriptions | jq
```

### Check Status

```bash
curl http://localhost:3001/health | jq '.subscriptionRefreshJob'
```

## Configuration

Edit `src/config/subscriptions.ts`:

```typescript
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 1,  // 1 = current, 2 = current + next
  METALS_QUARTERS: 1,
  CURRENCY_QUARTERS: 1,
  GRAINS_MONTHS: 1,
  SOFTS_MONTHS: 1,
  VOLATILES_MONTHS: 1,
} as const;
```

For roll coverage, change values to `2` and restart Hub.
