# Repo Map

This document is the practical map of the `mk3` monorepo.

It is optimized for answering:

- where the product surface lives
- where the realtime data path lives
- what is required for the Redis-only beta runtime
- which areas are production-critical vs scaffolded

## Top Level

- `frontend/`
  Next.js 16 app for the Swordfish marketing site, auth flows, waitlist, billing/settings scaffolding, and the gated `/terminal` product surface.
- `backend/`
  Bun service that connects to Massive futures APIs, stores hot data in Redis, runs scheduled maintenance jobs, and serves REST/WebSocket data to the frontend.
- `docs/`
  Repo-wide deployment and working notes.
- `scripts/`
  Repo utilities, including Railway bootstrap helpers.

## Frontend

### Purpose

The frontend is the user-facing Swordfish app.

Its real beta product surface is the `/terminal` route, backed by a single hub-driven market-data path. Marketing, waitlist, onboarding, billing, and settings also exist, but several of those surfaces are incomplete or intentionally secondary for beta.

### Important Directories

- `frontend/src/app/`
  App Router routes and layouts.
- `frontend/src/providers/`
  App-wide and terminal-specific runtime providers.
- `frontend/src/lib/hub/`
  Hub bootstrap, WebSocket client, message parsing, and history loading.
- `frontend/src/store/`
  Zustand stores, especially the terminal market-data registry.
- `frontend/src/components/terminal/`
  Terminal header, dock, spotlight, modal, chart, and view components.
- `frontend/src/config/`
  Public and server env parsing.
- `frontend/docs/`
  Frontend architecture, data layer, beta scope, and operations docs.

### Route Map

- `frontend/src/app/(homeAmarketing)/page.tsx`
  Marketing landing page.
- `frontend/src/app/(homeAmarketing)/mission/page.tsx`
  Product narrative / positioning.
- `frontend/src/app/(homeAmarketing)/pricing/page.tsx`
  Pricing surface.
- `frontend/src/app/(homeAmarketing)/billing/page.tsx`
  Billing UI scaffold; not fully integrated with a provider.
- `frontend/src/app/(homeAmarketing)/settings/page.tsx`
  Settings surface.
- `frontend/src/app/(homeAmarketing)/onboarding/page.tsx`
  Post-auth onboarding flow.
- `frontend/src/app/(waitlist)/waitlist/page.tsx`
  Waitlist landing and submission flow.
- `frontend/src/app/auth/callback/route.ts`
  Supabase auth callback and redirect handling.
- `frontend/src/app/(features)/terminal/layout.tsx`
  Protected, subscription-gated terminal shell.
- `frontend/src/app/(features)/terminal/page.tsx`
  Terminal view switcher for `terminal`, `ai-lab`, and `backtesting`.

### Frontend Runtime Spine

- `frontend/src/providers/root-provider.tsx`
  Global provider stack: theme -> auth -> hub connection -> data bootstrap/ingest.
- `frontend/src/providers/auth-provider.tsx`
  Supabase-backed auth state and profile loading.
- `frontend/src/providers/connection-provider.tsx`
  Owns the typed hub WebSocket client.
- `frontend/src/providers/data-provider.tsx`
  Bootstraps symbols/snapshots/sessions and ingests live market-data bars.
- `frontend/src/providers/terminal-view-provider.tsx`
  Terminal view state and URL/localStorage sync.
- `frontend/src/store/use-ticker-store.ts`
  Authoritative frontend registry for symbols, series, snapshots, sessions, modal state, and chart settings.

### Terminal Data Path

1. `frontend/src/lib/hub/bootstrap.ts`
   Loads `/symbols`, `/snapshots`, and `/sessions`.
2. `frontend/src/providers/data-provider.tsx`
   Applies bootstrap data to the store, subscribes to live messages, and batches bar ingestion.
3. `frontend/src/lib/hub/client.ts`
   WebSocket client with reconnect behavior.
4. `frontend/src/lib/hub/history.ts`
   Loads `/bars/range/:symbol` for chart history.
5. `frontend/src/hooks/use-chart-series.ts`
   Builds view-ready chart data from history plus live bars.

### Protection / Gating

- `frontend/src/components/auth/protected-route.tsx`
  Auth gate for terminal routes.
- `frontend/src/components/auth/subscription-guard.tsx`
  Pro-tier gate for terminal access using the Supabase `subscriptions` table.
- `frontend/src/proxy.ts`
  Host canonicalization, optional waitlist-only rewrite, and Supabase session refresh.

### Frontend Areas To Treat As Beta-Critical

- `frontend/src/lib/hub/*`
- `frontend/src/providers/connection-provider.tsx`
- `frontend/src/providers/data-provider.tsx`
- `frontend/src/store/use-ticker-store.ts`
- `frontend/src/components/terminal/views/terminal/*`
- `frontend/src/components/terminal/ticker-modal/*`
- `frontend/src/hooks/use-chart-*`

### Frontend Areas That Are Present But Not Beta-Core

- `frontend/src/app/(features)/backtesting/*`
- `frontend/src/components/terminal/views/ai-lab/*`
- `frontend/src/components/terminal/views/stream/*`
- `frontend/src/app/(homeAmarketing)/billing/page.tsx`

## Backend

### Purpose

The backend is the realtime market-data hub for the beta terminal.

It connects to Massive futures APIs, writes hot-path market state into Redis, restores short-window history after disconnects, resolves active/front-month contracts, and exposes REST/WebSocket APIs for the frontend and operators.

### Important Directories

- `backend/src/server/`
  Entrypoint, HTTP/WebSocket server, job runtime, and data stores.
- `backend/src/jobs/`
  Scheduled maintenance and cache-refresh jobs.
- `backend/src/services/`
  Recovery orchestration.
- `backend/src/utils/`
  Futures universe, contract provider, front-month logic, session logic, and provider helpers.
- `backend/src/config/`
  Runtime env and subscription/session config.
- `backend/docs/`
  System overview, API, operations, and tracked concerns.

### Backend Runtime Spine

- `backend/src/server/index.ts`
  Main startup sequence.
- `backend/src/server/api/massive/ws_client.ts`
  Upstream Massive WebSocket client and live bar persistence.
- `backend/src/server/api/rest_client.ts`
  Public and admin HTTP API plus browser-facing WebSocket surface.
- `backend/src/server/data/redis_store.ts`
  Redis hot store for latest bars, time series, sessions, snapshots, active contracts, and metadata.
- `backend/src/services/recovery_service.ts`
  Recovery orchestration and provider backfill.
- `backend/src/server/data/recovery_store.ts`
  SQLite-backed local recovery cache.
- `backend/src/server/job_runtime.ts`
  Startup bootstraps and recurring job scheduling.

### Contract / Subscription Logic

- `backend/src/utils/futures_universe.ts`
  Product/root universe from local metadata.
- `backend/src/utils/contract_provider.ts`
  Active contract discovery from Massive.
- `backend/src/utils/cbs/schedule_cb.ts`
  Subscription construction.
- `backend/src/utils/front_month_resolver.ts`
  Front-month ranking by volume, open interest, and expiry.

### Scheduled Jobs

- `backend/src/jobs/clear_daily.ts`
  Daily Redis maintenance / clear.
- `backend/src/jobs/refresh_subscriptions.ts`
  Monthly subscription refresh from active contracts.
- `backend/src/jobs/snapshot_job.ts`
  Snapshot refresh.
- `backend/src/jobs/front_month_job.ts`
  Front-month refresh.

### Backend Areas To Treat As Beta-Critical

- `backend/src/server/index.ts`
- `backend/src/server/api/massive/ws_client.ts`
- `backend/src/server/api/rest_client.ts`
- `backend/src/server/data/redis_store.ts`
- `backend/src/services/recovery_service.ts`
- `backend/src/server/job_runtime.ts`
- `backend/src/utils/contract_provider.ts`
- `backend/src/utils/front_month_resolver.ts`

### Backend Areas That Exist But Are Not On The Required Beta Path

- `backend/src/server/data/timescale_store.ts`
  Historical persistence abstraction; optional and paused for current runtime.

## Runtime Boundaries

### Required For Redis-Only Beta

- Frontend service
- Backend service
- Redis service
- Massive API key
- Supabase auth/profile/subscription setup

### Explicitly Optional For Redis-Only Beta

- TimescaleDB
- long-window historical analytics
- fully integrated billing provider
- AI Lab
- backtesting

## Fast Orientation Paths

### If you need to debug live bars

Read in this order:

1. `backend/src/server/api/massive/ws_client.ts`
2. `backend/src/server/data/redis_store.ts`
3. `frontend/src/lib/hub/client.ts`
4. `frontend/src/providers/data-provider.tsx`
5. `frontend/src/store/use-ticker-store.ts`

### If you need to debug chart history

Read in this order:

1. `backend/src/server/api/rest_client.ts`
2. `frontend/src/lib/hub/history.ts`
3. `frontend/src/hooks/use-chart-history.ts`
4. `frontend/src/hooks/use-chart-series.ts`

### If you need to debug deployment

Read in this order:

1. `docs/railway.md`
2. `frontend/docs/operations.md`
3. `backend/docs/operations.md`
4. `frontend/src/config/env.ts`
5. `backend/src/config/env.ts`
