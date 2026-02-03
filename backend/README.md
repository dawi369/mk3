# MK3 Backend (Bun)

Real-time futures data backend using Polygon.io WebSocket API.

## Prerequisites

- [Bun](https://bun.sh) v1.3.3+
- Redis (Docker or local)
- Valid Polygon.io API key
- TimescaleDB (optional, for historical storage)

## Quick Start

```bash
# Install dependencies
bun install

# Development (with hot reload)
bun run dev

# Production
bun run start
```

## Configuration

Create `.env` file:

```bash
POLYGON_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
HUB_REST_PORT=3001
DATABASE_URL=postgres://...  # Optional: TimescaleDB
```

## Test the API

```bash
# Health check
curl http://localhost:3001/health | jq

# Latest bars
curl http://localhost:3001/bars/latest | jq

# Subscriptions
curl http://localhost:3001/admin/subscriptions | jq
```

## Documentation

See [docs/README.md](./docs/README.md) for complete documentation.

## Troubleshooting

**Server won't start:**
1. Check Redis: `docker ps`
2. Verify `.env` file with `POLYGON_API_KEY`
3. Check Bun version: `bun --version`

**No data flowing:**
1. Verify market hours (Mon-Fri, not 5pm-6pm ET)
2. Check subscriptions: `curl http://localhost:3001/admin/subscriptions`
