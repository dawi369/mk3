# Redis-Only Beta Readiness

This document answers a specific question:

How far is `mk3` from a deployable beta that runs on:

- `frontend`
- `backend`
- `redis`

with no TimescaleDB requirement.

## Short Answer

The core runtime is already designed for a Redis-only beta.

The main market-data path is close to deployable today:

- frontend expects only the hub API and WebSocket
- backend treats Redis as the primary store
- TimescaleDB is explicitly optional and paused
- Railway docs already model the deployment as `frontend + backend + redis`

The remaining distance is not the core Redis architecture. It is production hardening around:

- Redis-backed operational verification
- access control and route exposure
- simplifying or hiding unfinished billing/account surfaces
- making beta launch policy explicit for who gets terminal access

## What Is Already Ready

### 1. The architecture already matches the target

Evidence:

- `README.md` defines the repo as `frontend` + `backend`.
- `docs/railway.md` defines the intended deployment as `mk3-frontend`, `mk3-backend`, and `mk3-redis`.
- `backend/docs/operations.md` states:
  - primary data store is Redis
  - historical store is paused
  - TimescaleDB is not part of the required runtime path

### 2. The backend supports Redis as the required hot path

Evidence:

- `backend/src/config/env.ts` supports `REDIS_URL` directly for Railway-style deployment.
- `backend/src/server/index.ts` boots Redis first, then recovery, then Massive, then jobs and HTTP/WebSocket serving.
- `backend/src/server/data/redis_store.ts` is the operational hot store for:
  - latest bars
  - time series
  - sessions
  - snapshots
  - active contracts
  - subscribed symbol metadata

### 3. The frontend depends on the right backend contract for beta

Evidence:

- `frontend/docs/data-layer.md` defines the required backend contract as:
  - `GET /symbols`
  - `GET /snapshots`
  - `GET /sessions`
  - `GET /bars/range/:symbol`
  - hub WebSocket stream
- `frontend/src/lib/hub/bootstrap.ts` loads only those bootstrap endpoints.
- `frontend/src/providers/data-provider.tsx` and `frontend/src/lib/hub/client.ts` are built around that single hub path.

### 4. The current docs already frame beta correctly

Evidence:

- `frontend/docs/terminal.md` defines beta around watchlists, charts, comparisons/spreads, and session-aware market state.
- `frontend/docs/concerns/beta-scope.md` explicitly excludes billing/account management as beta core.
- Notion page `mk3` last touched on `2026-04-06` says the focus is hardening the beta terminal around the core data path, charts, comparisons, and deployable ops.

## What I Verified Locally

Checked on `2026-04-11`.

### Passing checks

- frontend typecheck:
  - `cd frontend && bunx tsc --noEmit --skipLibCheck`
- backend typecheck:
  - `cd backend && bunx tsc --noEmit --skipLibCheck`
- frontend data-layer tests:
  - `cd frontend && bunx vitest run src/lib/hub/bootstrap.test.ts src/lib/hub/client.test.ts src/lib/hub/history.test.ts src/providers/data-provider.test.tsx src/store/use-ticker-store.test.ts`
  - result: `5 files passed, 15 tests passed`
- backend runtime/API tests that do not require live Redis:
  - `job_runtime.test.ts`
  - `rest_client.test.ts`
  - `ws_client.test.ts`
  - result: passing

### Expected environment-dependent failures

- backend Redis-backed tests fail without a reachable Redis instance:
  - `src/tests/redis_store.test.ts`
  - `src/tests/redis_store_contracts.test.ts`

Failure mode:

- `Redis test runtime requires a reachable Redis instance`

This is not a product-code regression. It means the final confidence check for beta deployment still needs to be run against a real Redis service.

## Readiness By Area

### Green

- Redis-first backend architecture
- Railway deployment shape
- frontend/backend hub contract
- optional Timescale posture
- focused frontend data-layer test coverage
- backend public/admin API and WS behavior in unit/integration-style tests

### Yellow

- backend operational proof still needs a real Redis-backed test run in a deployment-like environment
- admin endpoints are API-key protected but still operationally light for internet exposure
- in-memory rate limiting exists on both frontend server actions and backend API, but it is per-instance only
- session handling is good enough for beta but still documented as approximate for all futures products
- provider quality remains an external dependency for active contracts, snapshots, and front-month confidence

### Red

- terminal access is currently gated by `SubscriptionGuard`, which requires a `pro` subscription row in Supabase
- billing UI exists, but checkout, portal/account management, transaction history, and payment method flows are explicitly unfinished

This does not block a closed beta if you manually provision access. It does block a clean self-serve paid beta.

## The Real Deployment Gap

The biggest gap is not Redis.

The biggest gap is beta access policy.

Right now:

- `/terminal` is behind auth and a Pro subscription check
- billing is not actually finished
- docs say incomplete billing should not shape the beta core

So the repo needs one of these decisions before launch:

1. Closed beta:
   Keep terminal access gated, but provision `pro` access manually in Supabase for invited users.
2. Open product beta:
   Finish billing/provider integration enough to make the gating honest.
3. Temporary beta simplification:
   Replace the current Pro subscription requirement with a simpler beta-access flag while billing remains deferred.

Without that decision, the Redis-only architecture can deploy, but the user-access story is still inconsistent.

## Concrete Blockers Before I Would Call It Beta-Deployable

### Blocker 1. Run Redis-backed backend verification in a real environment

Minimum bar:

- boot backend against real Redis
- verify `/health`
- verify `/symbols`, `/snapshots`, `/sessions`
- verify live WS subscriptions populate Redis
- run:
  - `bun test src/tests/redis_store.test.ts src/tests/redis_store_contracts.test.ts`

### Blocker 2. Decide beta access model

Pick one:

- manual Pro provisioning in Supabase
- beta-access flag
- real billing

The current hybrid state is fragile and confusing.

### Blocker 3. Reduce unfinished surface area

For a Redis-only beta, unfinished pages should not look production-ready unless they are operationally backed.

Highest-risk surfaces:

- `frontend/src/app/(homeAmarketing)/billing/page.tsx`
- `frontend/src/app/(homeAmarketing)/settings/page.tsx`
- placeholder terminal views such as AI Lab and Backtesting

### Blocker 4. Tighten backend exposure

Before public beta, confirm:

- `HUB_ALLOWED_ORIGINS`
- `HUB_ADMIN_ALLOWED_ORIGINS`
- strong `HUB_API_KEY`
- whether admin endpoints should remain on the public backend host at all

### Blocker 5. Validate the actual launch flow

End-to-end:

1. visit public site
2. auth/login
3. onboarding
4. authorized access to `/terminal`
5. terminal bootstrap succeeds
6. chart history loads
7. live updates arrive

This matters more than adding more architecture.

## Recommended Next Moves

### If the goal is a closed Redis-only beta in the shortest time

1. Keep Timescale disabled.
2. Deploy `frontend + backend + redis` on Railway exactly as documented.
3. Run Redis-backed backend tests against the deployed or staging Redis service.
4. Choose manual Pro provisioning for invited users.
5. Hide or clearly mark unfinished billing/account surfaces.
6. Run one end-to-end launch checklist with real accounts and real market hours.

### If the goal is a self-serve paid beta

Do not treat billing as deferred anymore. The current gating model is not honest enough for that launch shape.

## Bottom Line

From an infrastructure and runtime perspective, the repo is fairly close to a Redis-only beta deployment.

From a product and operations perspective, the remaining work is mostly:

- proving Redis-backed behavior in a real environment
- choosing a simple, consistent access-control model
- trimming or isolating unfinished product surfaces

That is a much shorter path than reworking the data architecture.
