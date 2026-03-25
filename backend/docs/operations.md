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
# Reserved for future historical storage work
DATABASE_URL=postgres://...
```

## Local Startup

```bash
docker compose up -d redis
cd backend
bun install
bun run dev
```

## Health Checks

Primary endpoint:

```bash
curl http://localhost:3001/health | jq
```

Healthy state means:

- Redis is reachable
- upstream WebSocket is connected
- TimescaleDB is either `disabled` or connected

Important fields:

- `services.redis`
- `services.massiveWs`
- `services.timescaledb`
- `subscriptionRefreshJob`
- `dailyClearJob`

## Admin Endpoints

Use `X-API-Key` or `Authorization: Bearer ...`.

```bash
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/subscriptions | jq
curl -X POST -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/refresh-subscriptions | jq
curl -X POST -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/refresh-front-months | jq
curl -X POST -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/refresh-snapshots | jq
curl -X POST -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/clear-redis | jq
```

## Operational Endpoints

```bash
curl http://localhost:3001/front-months | jq
curl http://localhost:3001/contracts/active | jq
curl http://localhost:3001/bars/latest | jq
curl http://localhost:3001/sessions | jq
curl http://localhost:3001/sessions/week/ESM6 | jq
curl http://localhost:3001/snapshots | jq
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

## Known Runtime Boundaries

- TimescaleDB is not part of the required runtime path.
- Front-month resolution depends on upstream active-contract and snapshot coverage.
- Session history is retained in Redis for the rolling hot window only.
- Session rules currently default to a Chicago futures template with venue/root override hooks for later refinement.

See [concerns/README.md](./concerns/README.md) for tracked gaps.
