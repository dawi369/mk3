import { Redis } from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from '@/config/env.js';
import type { Bar } from '@/utils/general_types.js';
import { barCache } from './bar_cache.js';

/**
 * Edge Redis client with two connections:
 * - Main connection for normal operations (GET, LRANGE, SCAN)
 * - Subscriber connection for pub/sub (receives real-time bars)
 * 
 * Redis pub/sub blocks the connection, so we need separate connections.
 */
class EdgeRedisClient {
  private redis: Redis;
  private subscriber: Redis;
  private barCallbacks: Array<(bar: Bar) => void> = [];

  constructor() {
    // Main Redis connection for normal operations
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
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.setupListeners();
  }

  /**
   * Set up connection event listeners
   */
  private setupListeners(): void {
    this.redis.on('connect', () => console.log('Edge Redis connected'));
    this.redis.on('error', (err) => {
      console.error('Edge Redis error:', err);
      console.error('Fatal: Redis connection failed. Exiting...');
      process.exit(1);
    });

    this.subscriber.on('connect', () => console.log('Edge Redis subscriber connected'));
    this.subscriber.on('error', (err) => {
      console.error('Edge subscriber error:', err);
      console.error('Fatal: Redis subscriber failed. Exiting...');
      process.exit(1);
    });
  }

  /**
   * Load today's snapshot from Redis on startup.
   * Scans for bar:today:* keys and loads all bars into cache.
   */
  async loadTodaySnapshot(): Promise<void> {
    console.log('Loading today snapshot from Redis...');

    // Get all bar:today:* keys using non-blocking SCAN
    const keys = await this.scanKeys('bar:today:*');
    console.log(`Found ${keys.length} symbols`);

    if (keys.length === 0) {
      console.warn('No bars found in Redis. Is Hub running?');
      return;
    }

    // Load bars for each symbol
    for (const key of keys) {
      const symbol = key.replace('bar:today:', '');

      // Get all bars for this symbol (today's data)
      const barsJson = await this.redis.lrange(key, 0, -1);
      const bars: Bar[] = barsJson.map(json => JSON.parse(json));

      // Store in local cache
      barCache.set(symbol, bars);
      console.log(`Loaded ${bars.length} bars for ${symbol}`);
    }

    console.log('Snapshot loaded');
  }

  /**
   * Scan Redis keys using SCAN (non-blocking, production-safe)
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, foundKeys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      keys.push(...foundKeys);
      cursor = newCursor;
    } while (cursor !== '0');

    return keys;
  }

  /**
   * Subscribe to Redis pub/sub channel to receive real-time bars
   */
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

  /**
   * Register callback to be notified when new bar arrives
   */
  onBar(callback: (bar: Bar) => void): void {
    this.barCallbacks.push(callback);
  }

  /**
   * Handle incoming bar from pub/sub
   */
  private handleBar(message: string): void {
    try {
      const bar: Bar = JSON.parse(message);

      // Update cache
      barCache.append(bar);

      // Notify all registered callbacks
      for (const callback of this.barCallbacks) {
        callback(bar);
      }

      console.log(`Bar received: ${bar.symbol} @ ${bar.close}`);
    } catch (err) {
      console.error('Failed to parse bar:', err);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { symbols: number; totalBars: number } {
    return barCache.getStats();
  }
}

export const edgeRedisClient = new EdgeRedisClient();

