# MK3 Backend Documentation

## Overview

Real-time futures data backend using Polygon.io WebSocket API.

**Stack:** Bun, TypeScript, Redis, TimescaleDB

## Documentation Index

| Doc | Description |
|-----|-------------|
| [system-overview.md](./system-overview.md) | Architecture & data flow |
| [redis.md](./redis.md) | Redis key structure & operations |
| [database-structures.md](./database-structures.md) | Redis + TimescaleDB schemas |
| [futures-contract-management.md](./futures-contract-management.md) | Contract builders & refresh logic |

## Quick Start

```bash
# Start Hub server (dev mode)
bun run dev

# Health check
curl http://localhost:3001/health | jq

# Latest bars
curl http://localhost:3001/bars/latest | jq

# Current subscriptions
curl http://localhost:3001/admin/subscriptions | jq
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | System status + job statuses |
| `/bars/latest` | GET | All latest bars |
| `/bars/latest/:symbol` | GET | Latest bar for symbol |
| `/bars/today/:symbol` | GET | Today's bars for symbol |
| `/bars/week/:symbol` | GET | 7-day range (tf optional) |
| `/bars/range/:symbol` | GET | TimeSeries range (tf/start/end) |
| `/symbols` | GET | List of subscribed symbols |
| `/admin/subscriptions` | GET | Current WS subscriptions |
| `/admin/refresh-subscriptions` | POST | Manual subscription refresh |
| `/admin/clear-redis` | POST | Manual Redis clear |

## Current Subscriptions

6 asset classes, dynamically built:

- **US Indices** (quarterly): ES, NQ, YM, RTY
- **Metals** (quarterly): GC, SI, HG, PL, PA, MGC
- **Currencies** (quarterly): 6E, 6J, 6B, 6C, 6A, 6S
- **Grains** (monthly): ZC, ZW, ZS, ZM, ZL
- **Softs** (monthly): KC, CT, SB, CC, OJ, TT
- **Volatiles** (monthly): VX

## Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Daily Clear | 2 AM ET | Clear Redis data |
| Subscription Refresh | 1st of month @ 00:05 ET | Update contract subscriptions |
| Front Month Detection | 3 AM ET | Detect front month contracts |

## Configuration

### Environment Variables

```bash
POLYGON_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
HUB_REST_PORT=3001
DATABASE_URL=postgres://...
```

### Subscription Config (`src/config/subscriptions.ts`)

```typescript
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 1,  // 1 = current quarter only
  METALS_QUARTERS: 1,
  CURRENCY_QUARTERS: 1,
  GRAINS_MONTHS: 1,
  SOFTS_MONTHS: 1,
  VOLATILES_MONTHS: 1,
} as const;
```

## Troubleshooting

**Server won't start:**
1. Check Redis: `docker ps`
2. Verify `.env` file with `POLYGON_API_KEY`
3. Check Bun version: `bun --version`

**No data flowing:**
1. Verify market hours (Mon-Fri, not 5pm-6pm ET)
2. Check subscriptions: `curl http://localhost:3001/admin/subscriptions`
3. Review server logs for WS connection status
