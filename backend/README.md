# MK3 Backend (Bun)

Real-time futures data backend using Massive futures APIs.

## Prerequisites

- [Bun](https://bun.sh) v1.3.3+
- Redis (Docker or local)
- Valid Massive API key
- TimescaleDB is paused until futures flat-file or equivalent historical access is available

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
MASSIVE_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
HUB_PORT=3001
HUB_API_KEY=dev_only_secret
# DATABASE_URL=postgres://...  # Optional, reserved for future historical storage
# ENABLE_TIMESCALE=true        # Optional opt-in; disabled by default for now
```

## Test the API

```bash
# Health check
curl http://localhost:3001/health | jq

# Latest bars
curl http://localhost:3001/bars/latest | jq

# Subscriptions
curl http://localhost:3001/admin/subscriptions | jq

# Cached active contracts per product
curl http://localhost:3001/contracts/active | jq

# Front-month resolution
curl http://localhost:3001/front-months | jq

# Current trading-session bars
curl http://localhost:3001/bars/session/ESM6 | jq

# Retained session history
curl http://localhost:3001/sessions/week/ESM6 | jq
```

## Documentation

Start here:

- [docs/README.md](./docs/README.md)
- [docs/operations.md](./docs/operations.md)
- [docs/api-reference.md](./docs/api-reference.md)
- [docs/system-overview.md](./docs/system-overview.md)

## Troubleshooting

**Server won't start:**
1. Check Redis: `docker ps`
2. Verify `.env` file with `MASSIVE_API_KEY`
3. Check Bun version: `bun --version`

**No data flowing:**
1. Verify market hours (Mon-Fri, not 5pm-6pm ET)
2. Check subscriptions: `curl http://localhost:3001/admin/subscriptions`
3. Inspect cached contract universe: `curl http://localhost:3001/contracts/active`
