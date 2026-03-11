# MK3

MK3 is a full-stack futures market terminal with:

- a **Bun/TypeScript backend hub** for Polygon market data ingestion and distribution
- a **Next.js frontend** for the terminal, auth flows, billing screens, and supporting marketing pages
- **Redis Stack** and **TimescaleDB** as the core data services

## Start here

For the most complete technical description of the project, read:

- [`/docs/source-of-truth.md`](./docs/source-of-truth.md)

Supporting references:

- [`/ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`/backend/docs/README.md`](./backend/docs/README.md)
- [`/frontend/docs/ARCHITECTURE.md`](./frontend/docs/ARCHITECTURE.md)

## Runtime shape

```text
Polygon -> backend hub -> Redis/TimescaleDB -> REST/WebSocket hub -> frontend terminal
```

## Repository layout

```text
.
├── backend/
├── frontend/
├── docs/
├── docker-compose.yml
├── README.md
└── ARCHITECTURE.md
```
