import { describe, test, expect, beforeAll, afterAll, mock } from "bun:test";
import { redisStore } from "@/server/data/redis_store.js";
import type { Bar } from "@/types/common.types.js";

/**
 * Redis Store Unit Tests
 *
 * Run with: bun test src/tests/redis_store.test.ts
 */

describe("RedisStore", () => {
  const testSymbol = "TEST_ESZ25";

  beforeAll(async () => {
    // Verify Redis is available
    const pong = await redisStore.ping();
    if (pong !== "PONG") {
      throw new Error("Redis not available, skipping tests");
    }
  });

  afterAll(async () => {
    // Clean up test data
    await redisStore.redis.hdel("bar:latest", testSymbol);
    await redisStore.redis.del(`session:${testSymbol}`);
    await redisStore.redis.del(`snapshot:${testSymbol}`);
  });

  describe("ping", () => {
    test("returns PONG when Redis is connected", async () => {
      const result = await redisStore.ping();
      expect(result).toBe("PONG");
    });
  });

  describe("writeBar", () => {
    test("writes bar to latest hash", async () => {
      const bar: Bar = {
        symbol: testSymbol,
        open: 5000,
        high: 5010,
        low: 4990,
        close: 5005,
        volume: 100,
        trades: 50,
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        dollarVolume: 500500,
      };

      await redisStore.writeBar(bar);

      // Verify it was written to the hash
      const stored = await redisStore.redis.hget("bar:latest", testSymbol);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.symbol).toBe(testSymbol);
      expect(parsed.close).toBe(5005);
    });

    test("writes bar to timeseries", async () => {
      const now = Date.now();
      const bar: Bar = {
        symbol: testSymbol,
        open: 5010,
        high: 5020,
        low: 5000,
        close: 5015,
        volume: 150,
        trades: 75,
        startTime: now,
        endTime: now + 60000,
        dollarVolume: 752250,
      };

      await redisStore.writeBar(bar);

      const bars = await redisStore.getBarsRange(testSymbol, now - 1000, now + 1000, "1s");
      expect(bars.length).toBeGreaterThan(0);
      expect(bars[bars.length - 1]!.close).toBe(5015);
    });
  });

  describe("getLatest", () => {
    test("returns null for non-existent symbol", async () => {
      const result = await redisStore.getLatest("NONEXISTENT_SYMBOL_XYZ");
      expect(result).toBeNull();
    });

    test("returns bar for existing symbol", async () => {
      // First write a bar
      const bar: Bar = {
        symbol: testSymbol,
        open: 5020,
        high: 5030,
        low: 5010,
        close: 5025,
        volume: 200,
        trades: 100,
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        dollarVolume: 1005000,
      };
      await redisStore.writeBar(bar);

      const result = await redisStore.getLatest(testSymbol);
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe(testSymbol);
      expect(result!.close).toBe(5025);
    });
  });

  describe("getAllLatest", () => {
    test("returns map of symbol to bar", async () => {
      const result = await redisStore.getAllLatest();
      expect(typeof result).toBe("object");

      // Should include our test symbol if tests ran in order
      if (testSymbol in result) {
        expect(result[testSymbol]!.symbol).toBe(testSymbol);
      }
    });
  });

  describe("getAllLatestArray", () => {
    test("returns array of bars", async () => {
      const result = await redisStore.getAllLatestArray();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getSymbols", () => {
    test("returns array of symbol strings", async () => {
      const symbols = await redisStore.getSymbols();
      expect(Array.isArray(symbols)).toBe(true);
      expect(symbols).toContain(testSymbol);
    });
  });

  describe("getStats", () => {
    test("returns stats object with expected fields", async () => {
      const stats = await redisStore.getStats();
      expect(stats).toHaveProperty("date");
      expect(stats).toHaveProperty("barCount");
      expect(stats).toHaveProperty("symbolCount");
      expect(typeof stats.symbolCount).toBe("number");
    });
  });

  describe("session data", () => {
    test("getSession returns null for non-existent symbol", async () => {
      const result = await redisStore.getSession("NONEXISTENT_SESSION_XYZ");
      expect(result).toBeNull();
    });

    test("writeBar creates session data", async () => {
      // Write a bar - this should also create session data
      const bar: Bar = {
        symbol: testSymbol,
        open: 5100,
        high: 5110,
        low: 5090,
        close: 5105,
        volume: 500,
        trades: 25,
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        dollarVolume: 2552500,
      };

      await redisStore.writeBar(bar);

      const session = await redisStore.getSession(testSymbol);
      expect(session).not.toBeNull();
      expect(typeof session!.dayOpen).toBe("number");
      expect(session!.dayHigh).toBeGreaterThanOrEqual(bar.high);
      expect(session!.dayLow).toBeLessThanOrEqual(bar.low);
      expect(session!.cvol).toBeGreaterThan(0);
      expect(session!.vwap).toBeGreaterThan(0);
    });

    test("getAllSessions returns object of sessions", async () => {
      const sessions = await redisStore.getAllSessions();
      expect(typeof sessions).toBe("object");
      // Should include our test symbol
      if (testSymbol in sessions) {
        expect(sessions[testSymbol]!.dayOpen).toBeGreaterThan(0);
      }
    });
  });

  describe("snapshot data", () => {
    test("getSnapshot returns null for non-existent symbol", async () => {
      const result = await redisStore.getSnapshot("NONEXISTENT_SNAP_XYZ");
      expect(result).toBeNull();
    });

    test("writeSnapshot and getSnapshot work together", async () => {
      const snapshotData = {
        productCode: "TEST",
        settlementDate: "2026-03-20",
        sessionOpen: 5000,
        sessionHigh: 5050,
        sessionLow: 4950,
        sessionClose: 5020,
        settlementPrice: 5015,
        prevSettlement: 5010,
        change: 5,
        changePct: 0.1,
        openInterest: 12345,
        timestamp: Date.now(),
      };

      await redisStore.writeSnapshot(testSymbol, snapshotData);

      const retrieved = await redisStore.getSnapshot(testSymbol);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.productCode).toBe("TEST");
      expect(retrieved!.settlementPrice).toBe(5015);
      expect(retrieved!.prevSettlement).toBe(5010);
      expect(retrieved!.openInterest).toBe(12345);
    });

    test("getAllSnapshots returns object of snapshots", async () => {
      const snapshots = await redisStore.getAllSnapshots();
      expect(typeof snapshots).toBe("object");
    });
  });
});
