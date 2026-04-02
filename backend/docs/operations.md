# Operations

This document is the operator runbook for the backend as it exists today.

## Runtime Summary

- Runtime: Bun
- Primary data store: Redis
- Historical store: TimescaleDB remains in code but is paused
- Upstream provider: Massive futures APIs
- API surface: Bun HTTP + WebSocket server on `HUB_PORT`

## Required Environment

```bash
MASSIVE_API_KEY=...
MASSIVE_API_URL=https://api.massive.com
REDIS_HOST=localhost
REDIS_PORT=6379
HUB_PORT=3001
HUB_API_KEY=...
```

Optional:

```bash
# Explicit browser origins allowed by backend CORS
HUB_ALLOWED_ORIGINS=http://localhost:3010,https://app.example.com
# Optional browser origins allowed to call /admin routes
HUB_ADMIN_ALLOWED_ORIGINS=https://ops.example.com
# Optional request-rate controls
HUB_PUBLIC_RATE_LIMIT_WINDOW_MS=60000
HUB_PUBLIC_RATE_LIMIT_MAX=240
HUB_ADMIN_RATE_LIMIT_WINDOW_MS=60000
HUB_ADMIN_RATE_LIMIT_MAX=60
# Optional job-runtime controls
HUB_ENABLE_SCHEDULED_JOBS=true
HUB_BOOTSTRAP_SNAPSHOTS_ON_STARTUP=true
HUB_BOOTSTRAP_FRONT_MONTHS_ON_STARTUP=true
# Reserved for future historical storage work
DATABASE_URL=postgres://...
# Optional opt-in while historical storage is paused by default
ENABLE_TIMESCALE=true
```

## Local Startup

```bash
docker compose up -d redis
cd backend
bun install
bun run dev
```

Startup automatically:

- restores persisted job status from Redis
- bootstraps snapshot/front-month caches when missing or stale for the current ET day
- enables recurring maintenance schedules unless disabled by config

## Health Checks

Primary endpoint:

```bash
curl http://localhost:3001/health | jq
```

Healthy state means:

- Redis is reachable
- upstream WebSocket is connected
- TimescaleDB is either `disabled` or connected

Detailed operator health:

```bash
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/health | jq
```

Important fields:

- `services.redis`
- `services.massiveWs`
- `services.timescaledb`
- `subscriptionRefreshJob`
- `dailyClearJob`
- `snapshotJob`
- `frontMonthJob`

## Admin Endpoints

Use `X-API-Key` or `Authorization: Bearer ...`.

```bash
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/subscriptions | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/health | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/recovery/checkpoints | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/contracts/active | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/front-months | jq
curl -X POST -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/refresh-subscriptions | jq
curl -X POST -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/refresh-front-months | jq
curl -X POST -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/refresh-snapshots | jq
curl -X POST -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/clear-redis | jq
```

## Operational Endpoints

```bash
curl http://localhost:3001/sessions | jq
curl http://localhost:3001/snapshots | jq
curl "http://localhost:3001/bars/range/ESH6?tf=1m&start=1710000000000&end=1710086400000" | jq
```

Use these endpoints to answer:

- what symbols are actually subscribed
- what active contracts the backend currently sees
- what front month was resolved and with what confidence
- whether session and snapshot caches are populated

## Testing

Pure unit tests:

```bash
bun run test:unit
```

Redis-backed integration tests:

```bash
bun run test:redis
```

Full suite:

```bash
bun run test
```

Type-check:

```bash
bunx tsc --noEmit
```

## Scheduled Jobs

Default schedule:

- `DailyClearJob`: `2:00 AM ET`
- `SnapshotJob`: `2:05 AM ET`
- `FrontMonthJob`: `3:00 AM ET`
- `MonthlySubscriptionJob`: `12:05 AM ET` on the `1st` of each month

Disable all recurring schedules:

```bash
HUB_ENABLE_SCHEDULED_JOBS=false
```

Disable startup freshness bootstraps selectively:

```bash
HUB_BOOTSTRAP_SNAPSHOTS_ON_STARTUP=false
HUB_BOOTSTRAP_FRONT_MONTHS_ON_STARTUP=false
```

## Known Runtime Boundaries

- TimescaleDB is not part of the required runtime path.
- Front-month resolution depends on upstream active-contract and snapshot coverage.
- Session history is retained in Redis for the rolling hot window only.
- Session rules currently default to a Chicago futures template with venue/root override hooks for later refinement.

See [concerns/README.md](./concerns/README.md) for tracked gaps.
