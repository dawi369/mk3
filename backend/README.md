This is my futures dashboard project that utilizes the polygon websocket api. All code needs to be written with extreme care and precession, less is more. Only work is small steps and keep trying to get into from me.

## Backend Architecture

**Current Phase: Redis Real-Time Pipeline**

**Data Flow:**
- Real-time: Polygon WS (1-sec bars) → flowStore (memory) → Redis (today's bars)
- Redis clears daily at 2 AM ET (cron job)
- All futures tickers tracked (available on Polygon)

**Storage (Phase 1):**
- flowStore: In-memory singleton (latest + 100 bars per symbol)
- Redis: Today's intraday 1-sec bars, Docker local on Hub (~175MB/day for 50 symbols)

**Future Phases:**
- Phase 2: Add TimescaleDB Cloud for historical storage (1-min bars from flat files)
- Phase 3: Chart API combining Redis (today) + TimescaleDB (history)
- Phase 4: ML export from TimescaleDB

**Servers (Not Built Yet):**
- Hub: Owns Polygon WS, writes to Redis, serves Edge servers
- Edge: Reads from Hub, serves dashboard clients via WebSocket