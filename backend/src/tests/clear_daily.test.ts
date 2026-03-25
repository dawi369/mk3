import { describe, expect, spyOn, test } from "bun:test";
import { DailyClearJob } from "@/jobs/clear_daily.js";
import { redisStore } from "@/server/data/redis_store.js";

describe("DailyClearJob", () => {
  test("updates status after a successful clear", async () => {
    const job = new DailyClearJob();
    spyOn(redisStore, "clearTodayData").mockResolvedValue({
      cleared: 12,
      newDate: "2026-03-25",
    });
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await job.runClear(true);

    expect(job.getStatus().lastSuccess).toBe(true);
    expect(job.getStatus().clearedKeys).toBe(12);
  });

  test("records failure state when clear fails", async () => {
    const job = new DailyClearJob();
    spyOn(redisStore, "runDailyMaintenance").mockRejectedValue(
      new Error("clear failed"),
    );
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await job.runClear();

    expect(job.getStatus().lastSuccess).toBe(false);
    expect(job.getStatus().lastError).toContain("clear failed");
  });
});
