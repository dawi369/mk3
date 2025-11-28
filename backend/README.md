# MK3 Backend (Bun)

This is the MK3 Futures Dashboard backend, ported from Node.js to Bun for improved performance.

## Prerequisites

- [Bun](https://bun.sh) v1.3.3 or later
- Redis running (via Docker or locally)
- Valid Polygon.io API key

## Installation

Install dependencies:

```bash
bun install
```

## Configuration

Create or update `.env` file in the backend directory:

```bash
# Polygon API
POLYGON_API_KEY=your_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Hub Server
HUB_REST_PORT=3001
```

## Running the Server

### Development Mode (with auto-reload)

```bash
bun run dev
# or
bun --watch src/server/index.ts
```

This will start the Hub server with file watching enabled. Any changes to your TypeScript files will automatically restart the server.

### Production Mode

```bash
bun run start
# or
bun run run:server
# or directly
bun src/server/index.ts
```

### Quick Test

To verify Bun is working:

```bash
bun run index.ts
```

This should print "Hello via Bun!"

## Available Scripts

- `bun run dev` - Start server in watch mode (auto-reload on file changes)
- `bun run start` - Start server in production mode
- `bun run run:server` - Alias for start (matches old Node.js workflow)

## Testing the Server

Once running, test the Hub API:

```bash
# Health check
curl http://localhost:3001/health | jq

# Current subscriptions
curl http://localhost:3001/admin/subscriptions | jq

# Latest bars
curl http://localhost:3001/bars/latest | jq
```

## Documentation

For detailed documentation, see:

- [docs/README.md](./docs/README.md) - Complete backend overview
- [docs/system-overview.md](./docs/system-overview.md) - System architecture
- [docs/architecture.md](./docs/architecture.md) - Technical details

## Troubleshooting

### Server won't start

1. Check Redis is running: `docker ps`
2. Verify `.env` file exists with `POLYGON_API_KEY`
3. Check Bun version: `bun --version`

### No data flowing

1. Verify market hours (Mon-Fri, not 5pm-6pm ET)
2. Check subscriptions: `curl http://localhost:3001/admin/subscriptions`
3. Review server logs for WebSocket connection status

## Migration from Node.js

This project was ported from Node.js to Bun. Key changes:

- **Runtime**: `tsx` → `bun`
- **Watch mode**: `tsx watch` → `bun --watch`
- **Performance**: Significantly faster startup and execution
- **Native TypeScript**: No transpilation needed

The original Node.js version is preserved in `../backend_node/` for reference.

---

This project uses [Bun](https://bun.sh), a fast all-in-one JavaScript runtime.
