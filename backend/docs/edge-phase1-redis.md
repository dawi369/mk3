# Edge Server Phase 1: Redis Integration

## Goal

Connect Edge to Redis to receive real-time bar data from Hub. No frontend WebSocket yet, just consume data.

## What Edge Needs to Do

### On Startup
1. Connect to Redis
2. Load today's snapshot (`bar:today:*` keys)
3. Subscribe to Redis pub/sub channel `bars`
4. Store data in local cache

### During Operation
1. Receive bars from pub/sub in real-time
2. Update local cache
3. Log activity
4. Handle Redis disconnections (self-healing)

## Architecture

```
Redis (Hub writes to)
  ↓
  ├─ Keys: bar:today:ESZ25, bar:today:GCX25, ...
  └─ Pub/Sub: Channel "bars"
      ↓
  Edge Server
    ├─ Redis Client (ioredis)
    ├─ Local Cache (Map<symbol, Bar[]>)
    └─ Console logging (for now)
```

## Implementation Plan

### Step 1: Basic Redis Connection

**File:** `src/servers/edge/data/redis_client.ts`

**Create Redis client:**
```typescript
import { Redis } from 'ioredis';

class EdgeRedisClient {
  private redis: Redis;
  private subscriber: Redis;  // Separate connection for pub/sub
  
  constructor() {
    // Main Redis connection
    this.redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    
    // Separate connection for pub/sub (Redis requirement)
    this.subscriber = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
    });
    
    this.setupListeners();
  }
  
  private setupListeners(): void {
    this.redis.on('connect', () => console.log('Edge Redis connected'));
    this.redis.on('error', (err) => console.error('Edge Redis error:', err));
    
    this.subscriber.on('connect', () => console.log('Edge Redis subscriber connected'));
  }
}
```

**Why two connections?**
- Redis pub/sub blocks the connection
- Need separate connection for normal operations (GET, LRANGE, etc.)

### Step 2: Load Today's Snapshot

**Method:** `loadTodaySnapshot()`

```typescript
async loadTodaySnapshot(): Promise<void> {
  console.log('Loading today snapshot from Redis...');
  
  // Get all bar:today:* keys
  const keys = await this.scanKeys('bar:today:*');
  console.log(`Found ${keys.length} symbols`);
  
  for (const key of keys) {
    const symbol = key.replace('bar:today:', '');
    
    // Get all bars for this symbol (today's data)
    const barsJson = await this.redis.lrange(key, 0, -1);
    const bars = barsJson.map(json => JSON.parse(json));
    
    // Store in local cache
    this.cache.set(symbol, bars);
    console.log(`Loaded ${bars.length} bars for ${symbol}`);
  }
  
  console.log('Snapshot loaded');
}

private async scanKeys(pattern: string): Promise<string[]> {
  const keys = [];
  let cursor = '0';
  do {
    const [newCursor, foundKeys] = await this.redis.scan(
      cursor, 'MATCH', pattern, 'COUNT', 100
    );
    keys.push(...foundKeys);
    cursor = newCursor;
  } while (cursor !== '0');
  return keys;
}
```

### Step 3: Subscribe to Pub/Sub

**Method:** `subscribeToBars()`

```typescript
async subscribeToBars(): Promise<void> {
  console.log('Subscribing to Redis pub/sub channel: bars');
  
  // Subscribe to channel
  await this.subscriber.subscribe('bars');
  
  // Handle incoming messages
  this.subscriber.on('message', (channel, message) => {
    if (channel === 'bars') {
      this.handleBar(message);
    }
  });
  
  console.log('Subscribed to bars channel');
}

private handleBar(message: string): void {
  try {
    const bar: Bar = JSON.parse(message);
    
    // Update cache
    if (!this.cache.has(bar.symbol)) {
      this.cache.set(bar.symbol, []);
    }
    
    const bars = this.cache.get(bar.symbol)!;
    bars.push(bar);
    
    // Keep last 10,000 bars (match Hub's LTRIM)
    if (bars.length > 10000) {
      bars.shift();
    }
    
    console.log(`Bar received: ${bar.symbol} @ ${bar.close}`);
  } catch (err) {
    console.error('Failed to parse bar:', err);
  }
}
```

### Step 4: Local Cache

**File:** `src/servers/edge/data/bar_cache.ts`

```typescript
import type { Bar } from '@/utils/types.js';

class BarCache {
  private cache: Map<string, Bar[]> = new Map();
  private readonly MAX_BARS = 10000;
  
  set(symbol: string, bars: Bar[]): void {
    this.cache.set(symbol, bars);
  }
  
  append(bar: Bar): void {
    if (!this.cache.has(bar.symbol)) {
      this.cache.set(bar.symbol, []);
    }
    
    const bars = this.cache.get(bar.symbol)!;
    bars.push(bar);
    
    // Keep last 10,000
    if (bars.length > this.MAX_BARS) {
      bars.shift();
    }
  }
  
  getLatest(symbol: string): Bar | undefined {
    const bars = this.cache.get(symbol);
    return bars && bars.length > 0 ? bars[bars.length - 1] : undefined;
  }
  
  getBars(symbol: string, limit?: number): Bar[] {
    const bars = this.cache.get(symbol) || [];
    return limit ? bars.slice(-limit) : bars;
  }
  
  getAllSymbols(): string[] {
    return Array.from(this.cache.keys());
  }
  
  getStats(): { symbols: number; totalBars: number } {
    let totalBars = 0;
    for (const bars of this.cache.values()) {
      totalBars += bars.length;
    }
    return {
      symbols: this.cache.size,
      totalBars,
    };
  }
}

export const barCache = new BarCache();
```

### Step 5: Edge Entry Point

**File:** `src/servers/edge/index.ts`

```typescript
import { EdgeRedisClient } from './data/redis_client.js';

console.log('Starting Edge server...');

const redisClient = new EdgeRedisClient();

// 1. Load snapshot
await redisClient.loadTodaySnapshot();

// 2. Subscribe to real-time feed
await redisClient.subscribeToBars();

console.log('Edge server running');

// Log stats every 10 seconds
setInterval(() => {
  const stats = redisClient.getStats();
  console.log(`Stats: ${stats.symbols} symbols, ${stats.totalBars} total bars`);
}, 10_000);
```

## Configuration

Add to `config/env.ts` (shared with Hub):
```typescript
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
```

Edge uses same Redis as Hub (same Docker container).

## File Structure

```
src/servers/edge/
├── index.ts                    # Entry point
├── data/
│   ├── redis_client.ts        # Redis connection + pub/sub
│   └── bar_cache.ts           # In-memory bar storage
```

## Testing Strategy

### Manual Test

**Terminal 1: Start Hub**
```bash
cd /home/david/dev/mk3/backend
npx tsx src/servers/hub/index.ts
```

**Terminal 2: Start Edge**
```bash
cd /home/david/dev/mk3/backend
npx tsx src/servers/edge/index.ts
```

**Expected output:**
```
Starting Edge server...
Edge Redis connected
Edge Redis subscriber connected
Loading today snapshot from Redis...
Found 10 symbols
Loaded 1250 bars for ESZ25
Loaded 1250 bars for NQZ25
...
Snapshot loaded
Subscribing to Redis pub/sub channel: bars
Subscribed to bars channel
Edge server running

Bar received: ESZ25 @ 4500.5
Bar received: NQZ25 @ 16200.25
...

Stats: 10 symbols, 12500 total bars
```

### Validation

1. Edge loads snapshot on startup
2. Edge receives bars in real-time
3. Cache grows with new bars
4. Stats show increasing bar count

## Design Decisions

### 1. Two Redis Connections

**Why?**
- Redis pub/sub blocks the connection (can't do GET/LRANGE while subscribed)
- Standard pattern: one connection for pub/sub, one for everything else

**Alternatives considered:**
- Single connection with RESP3 ❌ (more complex, not needed)

### 2. Local Cache (Map)

**Why?**
- Fast access (no Redis roundtrip)
- Edge needs quick lookups for frontend requests
- Survives Redis restarts (has today's data in memory)

**Trade-off:**
- Uses memory (~10MB per 10,000 bars × 50 symbols = ~500MB)
- Acceptable for Edge server

### 3. SCAN vs KEYS

**Why SCAN?**
- Non-blocking (learned from Hub implementation)
- Scales to 500+ tickers
- Production-ready pattern

### 4. No Persistence on Edge

**Why?**
- Edge is ephemeral (can restart anytime)
- Gets fresh data from Redis on startup
- No need to persist (Hub has persistent Redis)

**Trade-off:**
- Restart = reload snapshot (~1-2 seconds for 50 symbols)
- Acceptable downtime

## Error Handling

### Redis Disconnects

```typescript
this.redis.on('error', (err) => {
  console.error('Redis error:', err);
  // ioredis auto-reconnects with retryStrategy
});

this.subscriber.on('error', (err) => {
  console.error('Subscriber error:', err);
});
```

**Behavior:**
- ioredis reconnects automatically with exponential backoff
- Pub/sub subscription maintained across reconnects
- No data loss (Hub keeps publishing to Redis)

### Malformed Bar Messages

```typescript
private handleBar(message: string): void {
  try {
    const bar: Bar = JSON.parse(message);
    // ...
  } catch (err) {
    console.error('Failed to parse bar:', err);
    // Skip this bar, continue processing
  }
}
```

### Empty Snapshot

```typescript
if (keys.length === 0) {
  console.warn('No bars found in Redis. Is Hub running?');
  // Continue anyway, will receive bars via pub/sub
}
```

## Next Steps (After Phase 1)

**Phase 2: Edge REST API** (~2-3 hours)
- Health endpoint with cache stats
- Bar queries (latest, history by symbol)
- Symbol info grouped by asset class
- Contract grouping (show all available contracts for a root symbol)

**Phase 3: WebSocket Server** (~4-6 hours)
- Accept client connections
- Client subscription to specific symbols (default: all symbols)
- Time-delayed streaming (e.g., 15-min delay, emulating real-time)
- Broadcast bars to subscribed clients

**Phase 4: Front Month Detection** (~2-3 hours)
- Determine current front month by date (use contract builder logic)
- Map root symbols to current contract (ES → ESZ25)
- Group contracts by root symbol for frontend dropdown
- Asset class grouping (US indices, metals, etc.)

## Success Metrics

Phase 1 complete when:
- Edge connects to Redis successfully
- Loads today's snapshot (all symbols)
- Receives bars via pub/sub in real-time
- Cache updates correctly
- Logs show data flow
- Can run alongside Hub without issues

## Open Questions

**Q1: Should Edge validate bar data?**
- For now: No, trust Hub
- Future: Add schema validation

**Q2: Should Edge log every bar?**
- For now: Yes (testing)
- Future: Sample logging (every 100th bar)

**Q3: How to handle Hub restart while Edge running?**
- Edge keeps running
- Snapshot might be stale until Hub republishes
- Redis pub/sub will resume when Hub reconnects
- Acceptable for Phase 1

**Q4: Memory limits for cache?**
- Current: 10,000 bars × 50 symbols = ~500MB
- If needed: Add MAX_SYMBOLS limit or TTL
- For now: Unlimited (trust Hub's ticker count)

