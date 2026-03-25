import { describe, expect, spyOn, test } from "bun:test";
import { SnapshotJob } from "@/jobs/snapshot_job.js";
import { redisStore } from "@/server/data/redis_store.js";
import * as massiveSnapshots from "@/utils/massive_snapshots.js";

describe("SnapshotJob", () => {
  test("deduplicates symbol sources and stores available snapshots", async () => {
    const job = new SnapshotJob();

    spyOn(redisStore, "getSubscribedSymbols").mockResolvedValue([
      "ESH9",
      "NQH9",
    ]);
    spyOn(redisStore, "getCachedActiveContractSymbols").mockResolvedValue([
      "NQH9",
      "GCJ9",
    ]);
    spyOn(massiveSnapshots, "fetchTickerSnapshotContract").mockImplementation(
      async (symbol: string) => {
        if (symbol === "NQH9") {
          return null;
        }

        return {
          details: {
            ticker: symbol,
            product_code: symbol.slice(0, -2),
            settlement_date: "2099-03-15",
          },
          session: {
            open: 10,
            high: 12,
            low: 9,
            close: 11,
            settlement_price: 11,
            previous_settlement: 10,
            change: 1,
            change_percent: 10,
          },
          open_interest: 100,
        } as any;
      },
    );
    const writeSnapshotSpy = spyOn(
      redisStore,
      "writeSnapshot",
    ).mockResolvedValue();
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await job.runRefresh();

    expect(writeSnapshotSpy).toHaveBeenCalledTimes(2);
    expect(job.getStatus().lastSuccess).toBe(true);
    expect(job.getStatus().symbolsUpdated).toBe(2);
  });

  test("completes successfully when there are no active symbols", async () => {
    const job = new SnapshotJob();
    spyOn(redisStore, "getSubscribedSymbols").mockResolvedValue([]);
    spyOn(redisStore, "getCachedActiveContractSymbols").mockResolvedValue([]);
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await job.runRefresh();

    expect(job.getStatus().lastSuccess).toBe(true);
    expect(job.getStatus().symbolsUpdated).toBe(0);
  });

  test("records failure state when refresh throws", async () => {
    const job = new SnapshotJob();
    spyOn(redisStore, "getSubscribedSymbols").mockRejectedValue(
      new Error("redis exploded"),
    );
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await job.runRefresh();

    expect(job.getStatus().lastSuccess).toBe(false);
    expect(job.getStatus().lastError).toContain("redis exploded");
  });
});
