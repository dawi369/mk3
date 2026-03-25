import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { timescaleStore } from "@/server/data/timescale_store.js";
import type { Bar } from "@/types/common.types.js";

const runTimescaleTests = Bun.env.RUN_TIMESCALE_TESTS === "1";

/**
 * TimescaleDB Store Tests
 *
 * Run with: bun test src/tests/timescale_store.test.ts
 *
 * NOTE: Requires TimescaleDB to be running.
 */

describe("TimescaleStore", () => {
  const testSymbol = "TEST_TIMESCALE_XYZ";
  let initialized = false;

  beforeAll(async () => {
    if (!runTimescaleTests) {
      return;
    }
    await timescaleStore.init();
    initialized = timescaleStore.isConnected;
    if (!initialized) {
      console.log("TimescaleDB not connected, some tests will be skipped");
    }
  });

  afterAll(async () => {
    if (!runTimescaleTests) {
      return;
    }
    await timescaleStore.close();
  });

  describe("connection", () => {
    test.skipIf(!runTimescaleTests)("isConnected returns boolean", () => {
      expect(typeof timescaleStore.isConnected).toBe("boolean");
    });

    test.skipIf(!runTimescaleTests)("ping returns true when connected", async () => {
      if (!initialized) return;
      const result = await timescaleStore.ping();
      expect(result).toBe(true);
    });
  });

  describe("insertBar", () => {
    test.skipIf(!runTimescaleTests)("inserts bar without error", async () => {
      if (!initialized) return;

      const bar: Bar = {
        symbol: testSymbol,
        open: 100,
        high: 105,
        low: 95,
        close: 102,
        volume: 1000,
        trades: 50,
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        dollarVolume: 102000,
      };

      // Should not throw
      await expect(timescaleStore.insertBar(bar)).resolves.toBeUndefined();
    });
  });

  describe("insertBatch", () => {
    test.skipIf(!runTimescaleTests)("inserts multiple bars without error", async () => {
      if (!initialized) return;

      const bars: Bar[] = [
        {
          symbol: testSymbol,
          open: 102,
          high: 108,
          low: 101,
          close: 106,
          volume: 1500,
          trades: 75,
          startTime: Date.now() + 60000,
          endTime: Date.now() + 120000,
          dollarVolume: 159000,
        },
        {
          symbol: testSymbol,
          open: 106,
          high: 110,
          low: 105,
          close: 109,
          volume: 2000,
          trades: 100,
          startTime: Date.now() + 120000,
          endTime: Date.now() + 180000,
          dollarVolume: 218000,
        },
      ];

      await expect(timescaleStore.insertBatch(bars)).resolves.toBeUndefined();
    });
  });

  describe("getHistory", () => {
    test.skipIf(!runTimescaleTests)("returns array of bars", async () => {
      if (!initialized) return;

      // Query for a wide time range
      const now = Date.now();
      const history = await timescaleStore.getHistory(
        testSymbol,
        now - 86400000, // 1 day ago
        now + 86400000  // 1 day ahead
      );

      expect(Array.isArray(history)).toBe(true);
    });
  });
});
