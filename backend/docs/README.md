# MK3 Futures Dashboard - Documentation

Last Updated: November 10, 2025  
Status: Hub Phase 1 Complete ✅ | Edge Phase 1 Complete ✅ | Edge Phase 2 Next 🔄

## Documentation Index

**[system-overview.md](./system-overview.md)** - Start here
- Complete system architecture
- Current status and roadmap
- 7-phase development plan

**[architecture.md](./architecture.md)** - Technical details
- Hub Phase 1 components
- Edge Phase 1 components
- Data flow
- API endpoints

**[edge-implementation-plan.md](./edge-implementation-plan.md)** - Edge server plan (NEW)
- Detailed Edge implementation roadmap
- Phase 2: REST API
- Phase 3: WebSocket server
- Phase 4: Front month detection

**[edge-phase1-redis.md](./edge-phase1-redis.md)** - Edge Redis integration
- Redis pub/sub setup
- Snapshot loading
- Bar cache implementation

**[futures-contract-management.md](./futures-contract-management.md)** - Contract strategy
- Problem and solution
- Contract builders
- Subscription refresh

**[subscription-refresh-implementation.md](./subscription-refresh-implementation.md)** - Implementation
- What was built
- How it works
- Files modified

**[testing-subscription-refresh.md](./testing-subscription-refresh.md)** - Testing
- Quick start commands
- Manual testing
- Troubleshooting

## Current Status

### Hub Phase 1 Complete ✅
- Real-time data ingestion from Polygon.io
- Dynamic contract builders (US indices, metals - both quarterly now)
- Automated monthly subscription refresh
- Dual storage (flowStore + Redis with pub/sub)
- Redis pub/sub broadcasting for Edge servers
- Daily Redis clear job
- Hub REST API with admin endpoints
- Self-healing WebSocket client
- Status persistence

### Edge Phase 1 Complete ✅
- Redis client (main + subscriber connections)
- Load today's snapshot from Redis
- Subscribe to Redis pub/sub channel `bars`
- In-memory bar cache (10,000 bars per symbol)
- Stats logging

### Edge Phase 2 Next 🔄
- REST API server (port 3002)
- Health & monitoring endpoints
- Bar queries (latest, history)
- Symbol grouping by asset class
- Contract grouping by root symbol

Current subscriptions:
- US Indices: ES, NQ, YM, RTY (quarterly)
- Metals: GC, SI, HG, PL, PA, MGC (quarterly)

Jobs:
- Daily clear: 2 AM ET
- Monthly refresh: 1st of month @ 00:05 ET

Data distribution:
- Hub → Redis keys: `bar:latest:*`, `bar:today:*`
- Hub → Redis pub/sub: Channel `bars`
- Edge ← Redis: Subscribes to channel `bars`, loads snapshot on startup

## Quick Start

### Start Hub
```bash
cd /home/david/dev/mk3/backend
npm run run:hub
```

### Start Edge
```bash
cd /home/david/dev/mk3/backend
npm run run:edge
```

### Test Hub API
```bash
# Health check
curl http://localhost:3001/health | jq

# Current subscriptions
curl http://localhost:3001/admin/subscriptions | jq

# Latest bars
curl http://localhost:3001/bars/latest | jq
```

### Test Edge (after Phase 2)
```bash
# Health check
curl http://localhost:3002/health | jq

# Latest bars
curl http://localhost:3002/bars/latest | jq

# Contracts for ES
curl http://localhost:3002/contracts/ES | jq
```

### Manual Operations
```bash
# Trigger subscription refresh
curl -X POST http://localhost:3001/admin/refresh-subscriptions | jq

# Trigger Redis clear
curl -X POST http://localhost:3001/admin/clear-redis | jq
```

## Configuration

### Subscription Counts

Edit `backend/src/config/subscriptions.ts`:
```typescript
export const SUBSCRIPTION_CONFIG = {
  US_INDICES_QUARTERS: 1,  // 1 = current, 2 = current + next
  METALS_MONTHS: 1,
} as const;
```

For roll coverage, change values to 2 and restart Hub.

### Environment Variables

Edit `backend/.env`:
```bash
# Polygon API
POLYGON_API_KEY=your_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Hub Server
HUB_REST_PORT=3001

# Edge Server (add these)
EDGE_REST_PORT=3002
EDGE_WS_PORT=3003
```

## Next Steps

### Immediate: Edge Phase 2 (REST API) - ~2-3 hours
- Create REST API server (Express, port 3002)
- Health endpoint with cache stats
- Bar queries (latest, history)
- Symbol grouping by asset class
- Contract grouping by root symbol

### Short-term: Edge Phases 3-4 - ~6-9 hours
- Phase 3: WebSocket server with client subscriptions and time-delayed streaming
- Phase 4: Front month detection (date-based) and contract mapping

### Medium-term: Multi-Asset Expansion - ~8-12 hours
- Add softs, energies, grains, treasuries contract builders
- Extend refresh job for all asset classes

See [edge-implementation-plan.md](./edge-implementation-plan.md) for detailed Edge roadmap.  
See [system-overview.md](./system-overview.md) for complete system roadmap.

## Troubleshooting

### Hub won't start
- Check Redis: `docker ps`
- Verify `.env` file with `POLYGON_API_KEY`

### No data flowing
- Check market hours (Mon-Fri, not 5pm-6pm ET)
- Verify subscriptions: `curl http://localhost:3001/admin/subscriptions`
- Check logs for WS connection status

### Subscription refresh not running
- Check logs: "Monthly subscription refresh job scheduled"
- Manual trigger: `curl -X POST http://localhost:3001/admin/refresh-subscriptions`
- Check status: `curl http://localhost:3001/health | jq '.subscriptionRefreshJob'`

### Status not persisting
- Verify Redis: `curl http://localhost:3001/health | jq '.redis'`
- Check Redis keys: `docker exec -it mk3-redis-1 redis-cli keys "job:*"`

## Roadmap

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| 1 | Hub Core Infrastructure | 40 hrs | Complete |
| 2 | Multi-Asset Expansion | 8-12 hrs | Next |
| 3 | Hub WebSocket Server | 12-16 hrs | Future |
| 4 | Edge Server | 16-20 hrs | Future |
| 5 | TimescaleDB Integration | 12-16 hrs | Future |
| 6 | ML Data Export | 8-12 hrs | Future |
| 7 | Frontend Dashboard | 24-32 hrs | Future |

Total: ~120-148 hours for complete system

## Support

For detailed information:
- System-wide questions: [system-overview.md](./system-overview.md)
- Technical architecture: [architecture.md](./architecture.md)
- Contract management: [futures-contract-management.md](./futures-contract-management.md)
- Refresh job details: [subscription-refresh-implementation.md](./subscription-refresh-implementation.md)
- Testing procedures: [testing-subscription-refresh.md](./testing-subscription-refresh.md)
