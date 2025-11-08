## Backend Architecture

**Current Phase: Production-Ready Core Infrastructure ✅**

**Completed:**
- ✅ Polygon WS client (self-healing, auto-reconnect, exponential backoff, market hours detection)
- ✅ Dual storage: flowStore (memory, latest + 100 bars) + Redis (today's data, persisted)
- ✅ Hub REST API (port 3000): Query bars, health, symbols, manual clear trigger
- ✅ Daily Redis clear (2 AM ET cron, persisted status, batched deletes, scales to 500+ tickers)
- ✅ Graceful operations (status tracking, idempotent clears, non-blocking scans)

**Data Flow:**
- Polygon WS (1-sec bars) → flowStore + Redis → Hub API
- Daily: Redis clears at 2 AM ET, preserves job metrics across restarts

**Hub API Endpoints:**
- `GET /health` - System status, Redis stats, daily job status
- `GET /bars/latest` - All latest bars from flowStore
- `GET /bars/latest/:symbol` - Specific symbol's latest bar
- `GET /bars/today/:symbol` - All today's bars from Redis
- `GET /symbols` - List of subscribed symbols
- `POST /admin/clear-redis` - Manual trigger for Redis clear

**Next Phases:**
- Phase 2: Multi-ticker support (load all futures from Tickers class)
- Phase 3: Hub WebSocket server (real-time push to Edge servers)
- Phase 4: Edge server (client-facing layer)
- Phase 5: TimescaleDB + historical data
- Phase 6: ML data export