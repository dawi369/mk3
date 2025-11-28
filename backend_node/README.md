# Swordfish Backend

## Overview

The backend for the Swordfish futures dashboard. It handles:

- **Ingestion:** Real-time market data from Polygon.io (WebSocket).
- **Storage:**
  - **Redis:** Real-time data (today's bars), Pub/Sub, and caching.
  - **TimescaleDB:** Historical data (yesterday and older).
- **API:** REST API for frontend clients.

## Maintenance

### ⚠️ Critical: Redis Clear Jobs

The daily clear job (`src/jobs/clear_daily.ts`) runs at 2:00 AM ET to wipe "today's data" and prepare for the new trading day.

**IMPORTANT:**
When implementing the **Historical Data Cache** (Phase 2), you must ensure the clear job **DOES NOT** wipe the historical cache keys.

- **Safe to Wipe:** `bar:today:*`, `bar:latest:*`
- **DO NOT WIPE:** `history:*` (These are expensive to rebuild!)

Ensure the clear job uses specific patterns (e.g., `SCAN` with `bar:*`) rather than `FLUSHDB`.
