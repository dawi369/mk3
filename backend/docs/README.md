# MK3 Backend Docs

Production-oriented documentation for the MK3 futures backend.

## Read This First

1. [operations.md](./operations.md)
   Startup, health checks, admin actions, testing, and runtime expectations.
2. [api-reference.md](./api-reference.md)
   Public and admin HTTP endpoints.
3. [system-overview.md](./system-overview.md)
   Runtime architecture and component responsibilities.

## Reference

- [redis.md](./redis.md)
  Redis keyspace, data retention, and hot-path behavior.
- [database-structures.md](./database-structures.md)
  Canonical data shapes used by the backend today.
- [futures-contract-management.md](./futures-contract-management.md)
  Subscription building, active-contract discovery, and front-month logic.

## Concerns And Roadmap

- [concerns/README.md](./concerns/README.md)
  Open concerns, deferred work, and provider limitations.
