# MK3 Technical Source of Truth

This document is the root technical reference for MK3. It connects the backend, frontend, infrastructure, and supporting docs into one place so contributors can understand how the application actually works before changing it.

For lower-level detail, use this file as the index and then drill into the subsystem docs linked at the end.

## 1. Repository shape

```text
mk3/
├── backend/              # Bun + TypeScript market data hub
├── frontend/             # Next.js 16 terminal and marketing site
├── docs/                 # Project-level documentation
├── docker-compose.yml    # Local Redis + TimescaleDB + backend stack
├── README.md             # Project entrypoint
└── ARCHITECTURE.md       # High-level architecture index
```

## 2. System purpose

MK3 is a futures market terminal split into two major runtimes:

1. **Backend hub** (`/backend`) ingests futures market data from Polygon, normalizes it, stores it in Redis and TimescaleDB-oriented structures, and exposes REST + WebSocket interfaces.
2. **Frontend app** (`/frontend`) renders the terminal UI, connects to the hub for live updates, hydrates charts from REST history, and layers on authentication, billing, and premium access controls.

The project is designed around one central idea: **the backend owns market data ingestion and derived market state, and the frontend is primarily a consumer of that state**.

## 3. Runtime topology

### Infrastructure services

`/docker-compose.yml` defines the local baseline runtime:

- **Redis Stack** on port `6379` for latest bars, RedisTimeSeries, session hashes, snapshots, and the `market_data` stream.
- **TimescaleDB** on port `5432` for longer-lived bar storage.
- **Backend** container on `HUB_PORT` (default `3001`).

There is no frontend container in the root compose file; frontend development is handled separately from `/frontend`.

### End-to-end data path

```text
Polygon futures WebSocket
  -> backend PolygonWSClient
  -> Redis latest hash + RedisTimeSeries + Redis stream
  -> backend REST/WebSocket hub
  -> frontend ConnectionProvider/DataProvider
  -> Zustand ticker store
  -> terminal cards, modal, charts, spotlight, spread tools
```

## 4. Backend implementation

### 4.1 Entry point and startup flow

The backend starts from `/backend/src/server/index.ts`.

Observed startup sequence:

1. Construct `PolygonWSClient`.
2. Connect to Polygon futures WebSocket.
3. Build subscription requests with `scheduleBuilder.buildRequestAsync(...)` for:
   - `us_indices`
   - `metals`
   - `currencies`
   - `grains`
   - `softs`
   - `volatiles`
4. Subscribe the Polygon client to each generated request.
5. Load persisted job state from Redis for:
   - daily clear
   - monthly subscription refresh
   - front month refresh
   - snapshots
6. Start the hub REST + WebSocket server via `startHubRESTApi(polygonClient)`.
7. Start a 5-second stats logger.
8. Register graceful shutdown handlers for SIGINT and SIGTERM.

Important current behavior:

- `timescaleStore.init()` is present but commented out in startup.
- The cron-backed job schedulers are also present but commented out:
  - `dailyClearJob.schedule()`
  - `monthlySubscriptionJob.schedule(...)`
  - `snapshotJob.schedule()`

That means the job classes are implemented and their admin endpoints exist, but scheduled execution is not currently enabled from the main server bootstrap.

### 4.2 Contract and subscription generation

Contract generation lives in `/backend/src/utils/cbs/schedule_cb.ts`.

Key rules:

- Product roots come from the `Tickers` utility and ticker metadata.
- Valid active month codes are sourced from `/backend/tickers/active_months.json`.
- Contract symbols are generated for the current and next year, then sorted by expiration order.
- How many contracts per asset class are subscribed is controlled by `/backend/src/config/subscriptions.ts`.

Practical outcome:

- quarterly-style groups such as US indices, metals, and currencies usually subscribe to the nearest configured quarter contracts.
- monthly groups such as grains, softs, and volatiles subscribe to the nearest configured monthly contracts.

### 4.3 Polygon integration

Live market ingestion is handled by `/backend/src/server/api/polygon/ws_client.ts`.

Responsibilities:

- connect to `wss://socket.polygon.io/futures`
- authenticate with `POLYGON_API_KEY`
- maintain subscription state
- reconnect with backoff
- normalize aggregate messages into internal `Bar` objects
- forward aggregate bars into storage layers

The backend is therefore event-driven. Once subscriptions are live, aggregate events become the main trigger for downstream updates.

### 4.4 Storage model

Primary storage logic lives in `/backend/src/server/data/redis_store.ts`.

#### Redis keys that matter most

- `bar:latest`
  - single hash
  - field = symbol
  - value = JSON-encoded latest bar
- `ts:bar:{tf}:{symbol}:{field}`
  - RedisTimeSeries
  - powers historical bar retrieval by timeframe
- `market_data`
  - Redis Stream
  - event bus used by the backend WebSocket broadcaster
- `session:{symbol}`
  - running intraday session statistics and indicator buckets
- `snapshot:{symbol}`
  - end-of-day / snapshot style metadata
- `meta:trading_date`
- `meta:bar_count`

#### What happens on every bar write

`writeBar(bar)` performs the core ingest work:

1. Ensure RedisTimeSeries keys and rules exist for the symbol.
2. Write OHLCV/trade values to time series storage.
3. Update `bar:latest`.
4. Increment `meta:bar_count`.
5. Append the bar to `market_data`.
6. Recompute `session:{symbol}` values such as:
   - `dayOpen`
   - `dayHigh`
   - `dayLow`
   - `vwap`
   - `cvol`
   - volume/VWAP bucket positions
7. Publish the bar to the legacy `bars` pub/sub channel.

#### Timeframe support

Both the REST layer and Redis layer recognize:

- `1s`
- `15s`
- `30s`
- `1m`
- `5m`
- `15m`
- `30m`
- `1h`
- `2h`
- `4h`
- `1d`

Downsampling rules are created in RedisTimeSeries so the backend can serve chart history without resampling everything in memory at request time.

### 4.5 TimescaleDB layer

TimescaleDB access lives in `/backend/src/server/data/timescale_store.ts`.

The codebase treats it as the long-horizon historical store. The documented schema includes:

- `bars` table with `symbol`, OHLC, `volume`, `vwap`, `timestamp`
- uniqueness on `(symbol, timestamp)`
- a `bars_30m` continuous aggregate

Operational nuance: the integration exists, but the startup file currently has initialization commented out, so Redis is the more active store in the presently wired runtime path.

### 4.6 Jobs and derived data

Job classes live in `/backend/src/jobs`.

#### Daily clear

File: `/backend/src/jobs/clear_daily.ts`

Purpose:

- clears current-day Redis market state
- resets metadata like `meta:trading_date` and `meta:bar_count`
- exposed manually via `POST /admin/clear-redis`

#### Subscription refresh

File: `/backend/src/jobs/refresh_subscriptions.ts`

Purpose:

- rebuild subscription lists using the contract scheduler
- refresh the Polygon client subscription set
- exposed manually via `POST /admin/refresh-subscriptions`

#### Front month detection

File: `/backend/src/jobs/front_month_job.ts`

Purpose:

- fetch Polygon contract snapshots by product code
- filter to outright contracts
- compare nearest expiry vs highest-volume contract
- cache the selected front month in `cache:front-months`

Important output per product:

- `frontMonth`
- `nearestExpiry`
- `isRolling`
- `daysToExpiry`
- `volume`
- `assetClass`

This cache is the frontend’s main source for front-month labeling and roll awareness.

#### Snapshot refresh

File: `/backend/src/jobs/snapshot_job.ts`

Purpose:

- populate `snapshot:{symbol}` hashes with settlement/open-interest style context
- exposed manually via `POST /admin/refresh-snapshots`

### 4.7 REST and WebSocket API surface

The hub API lives in `/backend/src/server/api/rest_client.ts`.

#### Public REST endpoints

- `GET /health`
- `GET /bars/latest`
- `GET /bars/latest/:symbol`
- `GET /bars/range/:symbol?start=ms&end=ms&tf=...`
- `GET /bars/week/:symbol?tf=...`
- `GET /bars/today/:symbol?tf=...`
- `GET /symbols`
- `GET /front-months`
- `GET /sessions`
- `GET /session/:symbol`
- `GET /snapshots`
- `GET /snapshot/:symbol`

#### Admin REST endpoints

Admin routes require either:

- `X-API-Key: <HUB_API_KEY>`
- `Authorization: Bearer <HUB_API_KEY>`

Endpoints:

- `POST /admin/clear-redis`
- `POST /admin/refresh-subscriptions`
- `GET /admin/subscriptions`
- `POST /admin/refresh-front-months`
- `POST /admin/refresh-snapshots`

#### Hub WebSocket

The Bun server upgrades all matching requests to WebSocket connections and:

- subscribes clients to the `market_data` topic
- sends the last 100 stream entries as a snapshot on connect
- broadcasts new Redis stream entries in near real time

This is the live feed consumed by the frontend `ConnectionProvider`.

### 4.8 Backend environment contract

Environment parsing is centralized in `/backend/src/config/env.ts`.

Required variables:

- `POLYGON_API_KEY`
- `POLYGON_API_URL`
- `HUB_PORT`
- `DATABASE_URL`
- `HUB_API_KEY`
- either `REDIS_URL` or both `REDIS_HOST` + `REDIS_PORT`

The backend is strict here: missing env values throw during module initialization.

## 5. Frontend implementation

### 5.1 App structure

The frontend is a Next.js App Router app rooted in `/frontend/src/app`.

Main route groups:

- `(homeAmarketing)`
  - landing page
  - login
  - onboarding
  - pricing
  - settings
  - billing
  - mission
- `(features)`
  - `/terminal`
  - `/backtesting`
- `(legal)`
  - terms
  - privacy
- `(waitlist)`
- `(robots)`

The terminal route is the most important runtime surface for the product.

### 5.2 Root provider stack

Project-wide provider composition lives in `/frontend/src/providers/root-provider.tsx`:

```text
ThemeProvider
  -> AuthProvider
    -> ConnectionProvider
      -> DataProvider
        -> GlobalBackground
        -> app content
```

Each provider has a specific responsibility:

- `ThemeProvider`
  - forces dark theme behavior
- `AuthProvider`
  - restores Supabase session
  - exposes profile/user state
- `ConnectionProvider`
  - owns the hub WebSocket connection
- `DataProvider`
  - hydrates ticker symbols
  - loads sessions and snapshots
  - batches incoming bars into Zustand

### 5.3 Terminal route provider stack

The terminal layout in `/frontend/src/app/(features)/terminal/layout.tsx` adds another nested provider stack:

```text
FrontMonthProvider
  -> TerminalViewProvider
    -> HeaderProvider
      -> SpotlightProvider
        -> ProtectedRoute
          -> SubscriptionGuard
            -> TerminalLayoutContent
```

This composition is important because terminal behavior is spread across several context layers instead of one monolithic screen component.

### 5.4 Connection and market data flow

#### ConnectionProvider

File: `/frontend/src/providers/connection-provider.tsx`

Key behavior:

- reads `NEXT_PUBLIC_HUB_URL`
- converts HTTP(S) URLs to WS(S) URLs automatically
- reconnects with exponential backoff up to 30 seconds
- provides a simple subscriber API for downstream consumers

This is why the frontend can use the same hub base URL for both REST fetches and WebSocket connections.

#### DataProvider

File: `/frontend/src/providers/data-provider.tsx`

Startup responsibilities:

1. Register all product codes into the store as **curve mode** symbols.
2. Fetch `/symbols` from the backend and register subscribed contracts as **front mode** symbols.
3. Fetch `/snapshots`.
4. Fetch `/sessions`.
5. Refresh sessions every 60 seconds.
6. Listen to live `market_data` messages and batch updates with `requestAnimationFrame`.

The provider does not own business calculations itself; it mainly feeds normalized backend data into the store.

### 5.5 State model

The main market state store is `/frontend/src/store/use-ticker-store.ts`.

Important structures:

- `entitiesByMode`
  - symbol metadata and latest bar
- `seriesByMode`
  - chart/history arrays per symbol
- `byAssetClassByMode`
  - grouping index for terminal rendering
- `selectionByMode`
  - modal selection state, comparisons, spread setup
- `snapshotsBySymbol`
- `sessionsBySymbol`

The two supported modes are:

- `front`
  - concrete contracts like `ESH6`
- `curve`
  - product/root symbols like `ES`

Current status:

- front mode is the primary live experience
- curve mode is indexed in the state model and data registration flow, but remains less fully wired in UI behavior

### 5.6 Terminal screen behavior

The terminal page itself lives in `/frontend/src/app/(features)/terminal/page.tsx`.

It swaps between four views using `TerminalViewProvider` state:

- `terminal`
- `ai-lab`
- `stream`
- `backtesting`

The actual view components live under `/frontend/src/components/terminal/views`.

#### Terminal view

Files:

- `/frontend/src/components/terminal/views/terminal/index.tsx`
- `/frontend/src/components/terminal/views/terminal/sector-container.tsx`
- `/frontend/src/components/terminal/views/terminal/ticker-entry.tsx`

Behavior:

- render asset-class containers
- display ticker cards with the latest market values
- support single-select and multi-select interactions
- feed the ticker modal when users drill into one or more contracts

### 5.7 Ticker modal and charting pipeline

The main drill-down surface is `/frontend/src/components/terminal/ticker-modal/ticker-modal.tsx`.

That component coordinates:

- primary symbol selection
- comparisons
- spread mode
- chart toolbar and range controls
- AI sidebar visibility
- tracked symbols for live updates while the modal is open

Historical series loading lives in `/frontend/src/hooks/use-chart-history.ts`.

Observed behavior:

- fetches `/bars/range/:symbol`
- chooses a default historical window by timeframe
- falls back to lower timeframes if sparse data comes back
- normalizes and limits result size before handing it to the chart layer

This means the frontend chart experience is **REST for history + WebSocket for ongoing bars**.

### 5.8 Front month awareness

`/frontend/src/providers/front-month-provider.tsx` periodically fetches `/front-months` and exposes helpers:

- `getFrontMonth(productCode)`
- `getNearestExpiry(productCode)`
- `isRolling(productCode)`
- `getInfo(productCode)`

The frontend therefore does not calculate front months itself. It relies on backend-produced cache entries.

### 5.9 Auth and access control

Authentication-related code is centered around:

- `/frontend/src/providers/auth-provider.tsx`
- `/frontend/src/utils/supabase/client.ts`
- `/frontend/src/utils/supabase/server.ts`
- `/frontend/src/components/auth/protected-route.tsx`
- `/frontend/src/components/auth/subscription-guard.tsx`

Access model:

- unauthenticated users are redirected away from protected feature routes
- authenticated users still need the correct subscription tier/status to access premium terminal features

### 5.10 Frontend environment contract

Client env parsing lives in `/frontend/src/config/env.ts`.

Required values:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_HUB_URL`

Optional:

- `NEXT_PUBLIC_MASSIVE_API_KEY`

Like the backend, the frontend fails fast if required public env vars are absent.

## 6. Source-of-truth rules for contributors

When updating MK3, treat the following ownership rules as canonical:

1. **Backend is the system of record for live bars, sessions, snapshots, and front-month logic.**
2. **Frontend store state is a projection of backend state, not a replacement for it.**
3. **REST is used for history and bulk hydration; WebSocket is used for live updates.**
4. **Contract generation is driven by asset-class config plus `active_months.json`, not hard-coded screen-level lists.**
5. **Front-month selection is determined by backend snapshot analysis, not by frontend heuristics.**
6. **The terminal UI is provider-driven; changes to selection, views, front-month behavior, and spotlight behavior often span multiple contexts.**

## 7. Build, lint, and test reality in this checkout

What exists in the repo today:

- `/frontend/package.json`
  - `npm run lint`
  - `npm run build`
- `/backend/package.json`
  - `bun run dev`
  - `bun run start`
  - `bun run run:server`
- `/backend/src/tests`
  - Bun test files exist even though there is no `test` script in `package.json`

What was observed in this environment while validating before the doc update:

- frontend `npm run lint` failed because `eslint` was not installed in the checkout environment
- frontend `npm run build` failed because `next` was not installed in the checkout environment
- backend `bun test` failed because `bun` was not available in the checkout environment

So the repo defines validation entrypoints, but this specific sandbox does not currently have the dependencies/runtime needed to execute them.

## 8. Recommended reading order

After this file, read the subsystem docs in this order:

### Project-level docs

- `/ARCHITECTURE.md`
- `/docs/time_series_redis.md`
- `/docs/candle.md`

### Backend docs

- `/backend/docs/README.md`
- `/backend/docs/system-overview.md`
- `/backend/docs/database-structures.md`
- `/backend/docs/redis.md`
- `/backend/docs/futures-contract-management.md`

### Frontend docs

- `/frontend/docs/ARCHITECTURE.md`
- `/frontend/docs/DESIGN.md`

## 9. Gaps that are important to remember

These are implementation truths worth calling out because they are easy to miss:

- the backend has job scheduling code, but scheduling is not currently enabled in `src/server/index.ts`
- TimescaleDB support exists in code and docs, but startup wiring is currently partial/commented
- the frontend depends on the backend hub being reachable from a single `NEXT_PUBLIC_HUB_URL`
- the richest UI interactions happen inside the ticker modal and its store/provider stack, not in the top-level terminal page

If this document and the code ever disagree, the code wins and this document should be updated immediately.
