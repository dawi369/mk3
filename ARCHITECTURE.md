# MK3 Architecture

The detailed technical source of truth for MK3 now lives in [`/docs/source-of-truth.md`](./docs/source-of-truth.md).

## Quick summary

- **Backend**: Bun + TypeScript hub that ingests Polygon futures data, writes Redis/RedisTimeSeries state, exposes REST + WebSocket APIs, and manages derived data such as sessions, snapshots, and front-month caches.
- **Frontend**: Next.js terminal that consumes the hub through one shared base URL, stores live market state in Zustand, and renders the provider-driven terminal/ticker-modal experience.
- **Infrastructure**: Redis Stack + TimescaleDB + backend are wired through `/docker-compose.yml`.

## Documentation map

- Primary project reference: [`/docs/source-of-truth.md`](./docs/source-of-truth.md)
- Backend docs: [`/backend/docs/README.md`](./backend/docs/README.md)
- Frontend docs: [`/frontend/docs/ARCHITECTURE.md`](./frontend/docs/ARCHITECTURE.md)

Use the source-of-truth doc first whenever you need to understand how the whole system fits together.
