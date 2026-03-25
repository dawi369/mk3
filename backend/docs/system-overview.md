# MK3 Backend - System Overview

## Architecture

```
Massive WS -> Bun hub -> Redis hot data + REST/WebSocket API
                           |
                           -> contract discovery + front-month resolution jobs
```

TimescaleDB remains in the codebase as a historical-storage abstraction, but it is not part of the active runtime while futures historical access is still incomplete.

## Main Runtime

- `src/server/index.ts`
  Boots the Massive futures WebSocket client, builds subscriptions, persists the subscribed symbol set, loads job state, and starts the Bun REST/WebSocket API.
- `src/server/api/massive/ws_client.ts`
  Handles the upstream market-data stream, reconnects on disconnects, and writes normalized bars into Redis.
- `src/server/api/rest_client.ts`
  Exposes health, bars, sessions, snapshots, front months, and active-contract cache inspection endpoints.
- `src/server/data/redis_store.ts`
  Stores the real-time hot path:
  - `bar:latest`
  - `ts:bar:*`
  - `market_data`
  - `session:*`
  - `snapshot:*`
  - `contracts:active:*`
  - `meta:subscribed_symbols`

## Contract Resolution

- `src/utils/futures_universe.ts`
  Builds the configured product universe from local metadata.
- `src/utils/contract_provider.ts`
  Fetches active contracts per product root from the futures contracts endpoint and caches them in-process.
- `src/utils/cbs/schedule_cb.ts`
  Builds live subscriptions from active contracts first, with static month-code generation only as fallback.
- `src/utils/front_month_resolver.ts`
  Ranks candidate contracts using:
  1. session volume
  2. open interest
  3. nearest valid expiry

## Jobs

| Job | File | Purpose |
|-----|------|---------|
| Daily Clear | `src/jobs/clear_daily.ts` | Clears hot intraday Redis state |
| Subscription Refresh | `src/jobs/refresh_subscriptions.ts` | Rebuilds WS subscriptions from current active contracts |
| Front Month Detection | `src/jobs/front_month_job.ts` | Resolves front months from active contracts + snapshots |
| Snapshot Refresh | `src/jobs/snapshot_job.ts` | Refreshes per-contract session snapshots for subscribed/cached contracts |

## Current Direction

- Redis is the source of truth for the hot path.
- Historical storage is paused.
- Front-month logic is based on active-contract metadata plus snapshot ranking, not just calendar inference.
- Operational visibility comes from:
  - `/health`
  - `/front-months`
  - `/contracts/active`
  - `/admin/subscriptions`
