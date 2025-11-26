import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "@/config/env.js";
import { LIMITS } from "@/config/limits.js";
import type { Bar } from "@/types/common.types.js";

class RedisStore {
  public redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      retryStrategy: (times) => {
        // Exponential backoff with max delay of 2 seconds
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on("connect", () => console.log("Redis connected"));
    this.redis.on("error", (err) => {
      console.error("Redis error:", err);
      console.error("Fatal: Redis connection failed. Exiting...");
      process.exit(1);
    });
  }

  async ping(): Promise<string> {
    return await this.redis.ping();
  }

  async writeBar(bar: Bar): Promise<void> {
    const multi = this.redis.multi();

    //supsub, legacy code, used for testing, xadd is the new way
    multi.set(`bar:latest:${bar.symbol}`, JSON.stringify(bar));
    multi.rpush(`bar:today:${bar.symbol}`, JSON.stringify(bar));
    multi.ltrim(`bar:today:${bar.symbol}`, -LIMITS.maxHubBars, -1);
    multi.incr("meta:bar_count");

    // Write to Redis Stream (max len ~100k to prevent infinite growth)
    multi.xadd(
      "market_data",
      "MAXLEN",
      "~",
      LIMITS.maxStreamLength.toString(),
      "*",
      "data",
      JSON.stringify(bar)
    );

    await multi.exec();

    // Publish to Redis pub/sub channel for Edge servers (Legacy support)
    await this.redis.publish("bars", JSON.stringify(bar));
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys = [];
    let cursor = "0";
    do {
      const [newCursor, foundKeys] = await this.redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        LIMITS.redisScanBatchSize
      );
      keys.push(...foundKeys);
      cursor = newCursor;
    } while (cursor !== "0");
    return keys;
  }

  private async deleteInBatches(
    keys: string[],
    batchSize = LIMITS.redisDeleteBatchSize
  ): Promise<number> {
    let deleted = 0;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await this.redis.del(...batch);
      deleted += batch.length;
    }
    return deleted;
  }

  async getLatest(symbol: string): Promise<Bar | null> {
    const data = await this.redis.get(`bar:latest:${symbol}`);
    return data ? JSON.parse(data) : null;
  }

  async getTodayBars(symbol: string): Promise<Bar[]> {
    const data = await this.redis.lrange(`bar:today:${symbol}`, 0, -1);
    return data.map((d) => JSON.parse(d));
  }

  async getStats(): Promise<{ date: string; barCount: number }> {
    const date = (await this.redis.get("meta:trading_date")) || "unknown";
    const count = parseInt((await this.redis.get("meta:bar_count")) || "0");
    return { date, barCount: count };
  }

  async clearTodayData(): Promise<{ cleared: number; newDate: string }> {
    const today = new Date().toISOString().split("T")[0]!;
    const lastClear = (await this.redis.get("meta:trading_date")) || "";

    if (lastClear === today) {
      console.log("Already cleared today, skipping");
      return { cleared: 0, newDate: today };
    }

    console.log(
      `Clearing Redis data (last clear: ${
        lastClear || "never"
      }, new date: ${today})`
    );

    const todayKeys = await this.scanKeys("bar:today:*");
    const latestKeys = await this.scanKeys("bar:latest:*");

    let clearedCount = 0;
    if (todayKeys.length > 0) {
      clearedCount += await this.deleteInBatches(todayKeys);
    }
    if (latestKeys.length > 0) {
      clearedCount += await this.deleteInBatches(latestKeys);
    }

    // This means it has to run in the morning of the new trading day
    await this.redis.set("meta:trading_date", today);
    await this.redis.set("meta:bar_count", "0");

    console.log(`Cleared ${clearedCount} keys`);

    return { cleared: clearedCount, newDate: today };
  }
}

export const redisStore = new RedisStore();
