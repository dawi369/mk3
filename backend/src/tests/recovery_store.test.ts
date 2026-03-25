import { describe, expect, test } from "bun:test";
import { recoveryStore } from "@/server/data/recovery_store.js";
import { RECOVERY_TIMEFRAME } from "@/types/recovery.types.js";
import type { Bar } from "@/types/common.types.js";

describe("FileRecoveryStore", () => {
  test("upserts and reads recoverable bars by symbol", async () => {
    await recoveryStore.init();

    const symbol = `TEST_RECOVERY_ES_${Date.now()}`;
    const now = Date.now();
    const bars: Bar[] = [
      {
        symbol,
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        volume: 10,
        trades: 2,
        startTime: now - 120000,
        endTime: now - 60000,
      },
      {
        symbol,
        open: 100.5,
        high: 102,
        low: 100,
        close: 101.5,
        volume: 12,
        trades: 3,
        startTime: now - 60000,
        endTime: now,
      },
    ];

    await recoveryStore.upsertBars(symbol, RECOVERY_TIMEFRAME, bars);
    await recoveryStore.upsertBars(symbol, RECOVERY_TIMEFRAME, [bars[1]!]);

    const loaded = await recoveryStore.getBars(
      symbol,
      RECOVERY_TIMEFRAME,
      now - 180000,
      now,
    );
    const latestTs = await recoveryStore.getLatestTimestamp(
      symbol,
      RECOVERY_TIMEFRAME,
    );
    const stats = await recoveryStore.getStats(symbol, RECOVERY_TIMEFRAME);

    expect(loaded).toHaveLength(2);
    expect(loaded[0]?.startTime).toBe(bars[0]?.startTime);
    expect(loaded[1]?.startTime).toBe(bars[1]?.startTime);
    expect(latestTs).toBe(bars[1]?.startTime ?? null);
    expect(stats.barCount).toBeGreaterThanOrEqual(2);
  });
});
