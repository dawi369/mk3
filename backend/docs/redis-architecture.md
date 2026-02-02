# Redis Architecture

This document describes how Redis is set up for real-time market data distribution.

## Overview

Redis serves as the **hot data layer** between the backend (data ingestion) and frontend (display). It stores the latest bars for each symbol and provides real-time streaming via pub/sub.

## Key Structure

| Key Pattern | Type | Description | TTL |
|-------------|------|-------------|-----|
| `bar:latest` | **HASH** | Symbol → Bar JSON. All latest bars in one hash. | None |
| `bar:today:{symbol}` | **LIST** | Today's bars for a specific symbol (capped at 500) | Cleared daily |
| `market_data` | **STREAM** | Real-time event bus for consumers | ~1000 entries |
| `meta:trading_date` | **STRING** | Last trading date (ISO format) | None |
| `meta:bar_count` | **STRING** | Total bars processed today | Cleared daily |

## Bar Schema

Each bar is stored as JSON with this structure:

```typescript
interface Bar {
  symbol: string;      // e.g. "ESH6"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  dollarVolume: number;
  startTime: number;   // epoch ms
  endTime: number;     // epoch ms
}
```

## Querying Redis

### Via Redis CLI

```bash
# Connect to container
docker exec -it mk3-redis redis-cli

# Get all symbol keys
HKEYS bar:latest

# Get latest bar for a symbol
HGET bar:latest ESH6

# Get all latest bars
HGETALL bar:latest

# Get today's bars for a symbol
LRANGE bar:today:ESH6 0 -1

# Check stats
GET meta:trading_date
GET meta:bar_count
```

### Via Backend API

The `redisStore` singleton exposes these methods:

```typescript
import { redisStore } from "@/server/data/redis_store.js";

// Single symbol
const bar = await redisStore.getLatest("ESH6");

// All symbols as map
const all = await redisStore.getAllLatest();  // { ESH6: Bar, CLG6: Bar, ... }

// All symbols as array
const bars = await redisStore.getAllLatestArray();  // Bar[]

// List of symbols
const symbols = await redisStore.getSymbols();  // ["ESH6", "CLG6", ...]

// Today's history for a symbol
const history = await redisStore.getTodayBars("ESH6");

// Stats
const stats = await redisStore.getStats();  // { date, barCount, symbolCount }
```

### Via Frontend WebSocket

The frontend connects to the Hub WebSocket and receives real-time bars:

```typescript
// Connection: ws://localhost:3001/ws
// Bars are pushed automatically via pub/sub
```

## Data Flow

```
Polygon API → Backend Ingestion → Redis (write) → Pub/Sub → Hub WS → Frontend
                                      ↓
                              bar:latest (HASH)
                              bar:today:* (LISTs)
                              market_data (STREAM)
```

## Maintenance

### Daily Reset

Data is cleared daily at **2 AM ET** via `clearTodayData()`:
- Deletes `bar:latest` hash
- Deletes all `bar:today:*` lists  
- Deletes `market_data` stream
- Resets `meta:bar_count` to 0
- Updates `meta:trading_date`

### Dev Scripts

```bash
# Probe Redis (see what's stored)
bun run dev_scripts/probe_redis.ts

# Clear Redis manually
bun run dev_scripts/clear_redis.ts
```

## Configuration

| Env Variable | Default | Description |
|--------------|---------|-------------|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | - | Optional password |

## Docker

```yaml
# docker-compose.yml
redis:
  image: redis:8.2-alpine
  container_name: mk3-redis
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  command: redis-server --appendonly yes
```

Persistence is enabled via `--appendonly yes` (AOF mode).
