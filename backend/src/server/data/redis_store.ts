import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "@/config/env.js";
import { LIMITS } from "@/config/limits.js";
import type { Bar } from "@/types/common.types.js";
import { Redis } from "ioredis";

// Redis Key Constants
const KEYS = {
  LATEST_HASH: "bar:latest", // HASH: symbol -> bar JSON
  TODAY_PREFIX: "bar:today:", // LIST per symbol: bar:today:{symbol}
  STREAM: "market_data", // STREAM: real-time event bus
  PUBSUB_CHANNEL: "bars", // PUB/SUB: legacy support
  META_DATE: "meta:trading_date",
  META_COUNT: "meta:bar_count",
} as const;

class RedisStore {
  public redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      retryStrategy: (times) => {
        // Exponential backoff with max delay of 2 seconds
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on("connect", () => console.log("Redis connected"));
    this.redis.on("error", (err: any) => {
      console.error("Redis error:", err);
      if (err.code === "ECONNREFUSED") {
        console.error(
          "❌ Redis connection refused. Is the 'redis' container running? (docker compose up -d redis)",
        );
      }
      console.error("Fatal: Redis connection failed. Exiting...");
      process.exit(1);
    });
  }

  async ping(): Promise<string> {
    return await this.redis.ping();
  }

  /**
   * Write a bar to all storage locations:
   * - HSET bar:latest {symbol} (latest bar per symbol in single hash)
   * - RPUSH bar:today:{symbol} (today's history per symbol)
   * - XADD market_data (real-time stream)
   * - PUBLISH bars (legacy pub/sub)
   */
  async writeBar(bar: Bar): Promise<void> {
    const barJson = JSON.stringify(bar);
    const multi = this.redis.multi();

    // Latest bar: single hash with symbol as field
    multi.hset(KEYS.LATEST_HASH, bar.symbol, barJson);

    // Today's bars: list per symbol (for historical queries within the day)
    multi.rpush(`${KEYS.TODAY_PREFIX}${bar.symbol}`, barJson);
    multi.ltrim(`${KEYS.TODAY_PREFIX}${bar.symbol}`, -LIMITS.maxHubBars, -1);

    // Metadata
    multi.incr(KEYS.META_COUNT);

    // Stream for real-time consumers
    multi.xadd(
      KEYS.STREAM,
      "MAXLEN",
      "~",
      LIMITS.maxStreamLength.toString(),
      "*",
      "data",
      barJson,
    );

    await multi.exec();

    // Legacy pub/sub for Edge servers
    await this.redis.publish(KEYS.PUBSUB_CHANNEL, barJson);
  }

  /**
   * Get latest bar for a specific symbol
   * O(1) operation using HGET
   */
  async getLatest(symbol: string): Promise<Bar | null> {
    const data = await this.redis.hget(KEYS.LATEST_HASH, symbol);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get all latest bars as a map of symbol -> Bar
   * O(N) where N is number of symbols, single round-trip
   */
  async getAllLatest(): Promise<Record<string, Bar>> {
    const data = await this.redis.hgetall(KEYS.LATEST_HASH);
    const result: Record<string, Bar> = {};
    for (const [symbol, json] of Object.entries(data)) {
      result[symbol] = JSON.parse(json);
    }
    return result;
  }

  /**
   * Get all latest bars as an array
   */
  async getAllLatestArray(): Promise<Bar[]> {
    const data = await this.redis.hgetall(KEYS.LATEST_HASH);
    return Object.values(data).map((json) => JSON.parse(json));
  }

  /**
   * Get list of all symbols with latest bars
   */
  async getSymbols(): Promise<string[]> {
    return await this.redis.hkeys(KEYS.LATEST_HASH);
  }

  /**
   * Get today's bars for a specific symbol
   */
  async getTodayBars(symbol: string): Promise<Bar[]> {
    const data = await this.redis.lrange(
      `${KEYS.TODAY_PREFIX}${symbol}`,
      0,
      -1,
    );
    return data.map((d) => JSON.parse(d));
  }

  async getStats(): Promise<{
    date: string;
    barCount: number;
    symbolCount: number;
  }> {
    const [date, count, symbolCount] = await Promise.all([
      this.redis.get(KEYS.META_DATE),
      this.redis.get(KEYS.META_COUNT),
      this.redis.hlen(KEYS.LATEST_HASH),
    ]);
    return {
      date: date || "unknown",
      barCount: parseInt(count || "0"),
      symbolCount,
    };
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [newCursor, foundKeys] = await this.redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        LIMITS.redisScanBatchSize,
      );
      keys.push(...foundKeys);
      cursor = newCursor;
    } while (cursor !== "0");
    return keys;
  }

  private async deleteInBatches(
    keys: string[],
    batchSize = LIMITS.redisDeleteBatchSize,
  ): Promise<number> {
    let deleted = 0;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await this.redis.del(...batch);
      deleted += batch.length;
    }
    return deleted;
  }

  /**
   * Clear today's data (run at 2 AM ET daily)
   * - Deletes bar:latest hash (single key now!)
   * - Deletes all bar:today:* lists
   * - Deletes market_data stream
   * @param force - If true, bypasses the "already cleared today" check
   */
  async clearTodayData(force = false): Promise<{ cleared: number; newDate: string }> {
    const today = new Date().toISOString().split("T")[0]!;
    const lastClear = (await this.redis.get(KEYS.META_DATE)) || "";

    if (!force && lastClear === today) {
      console.log("Already cleared today, skipping (use force=true to override)");
      return { cleared: 0, newDate: today };
    }

    console.log(
      `Clearing Redis data (last clear: ${lastClear || "never"}, new date: ${today}, force: ${force})`,
    );

    let clearedCount = 0;

    // Clear latest hash (single key)
    const latestDeleted = await this.redis.del(KEYS.LATEST_HASH);
    clearedCount += latestDeleted;

    // Clear market_data stream
    const streamDeleted = await this.redis.del(KEYS.STREAM);
    clearedCount += streamDeleted;

    // Clear today's bars (still need scan for bar:today:* pattern)
    const todayKeys = await this.scanKeys(`${KEYS.TODAY_PREFIX}*`);
    if (todayKeys.length > 0) {
      clearedCount += await this.deleteInBatches(todayKeys);
    }

    // Update metadata
    await this.redis.set(KEYS.META_DATE, today);
    await this.redis.set(KEYS.META_COUNT, "0");

    console.log(`Cleared ${clearedCount} keys`);

    return { cleared: clearedCount, newDate: today };
  }
}

export const redisStore = new RedisStore();
