import { describe, test, expect, beforeAll } from "bun:test";
import { frontMonthJob } from "@/jobs/front_month_job.js";

const runLiveTests = Bun.env.RUN_LIVE_TESTS === "1";

/**
 * Front Month Job Tests
 *
 * Run with: bun test src/tests/front_month_job.test.ts
 *
 * NOTE: These tests make real API calls to Massive.
 * They require MASSIVE_API_KEY to be set and network access.
 */

describe("FrontMonthJob", () => {
  describe("getStatus", () => {
    test("returns status object with expected fields", () => {
      const status = frontMonthJob.getStatus();
      expect(status).toHaveProperty("lastRunTime");
      expect(status).toHaveProperty("lastSuccess");
      expect(status).toHaveProperty("lastError");
      expect(status).toHaveProperty("totalRuns");
    });
  });

  describe("getCache", () => {
    test("returns null or cache object", () => {
      const cache = frontMonthJob.getCache();
      // Cache may be null if job hasn't run
      if (cache !== null) {
        expect(cache).toHaveProperty("lastUpdated");
        expect(cache).toHaveProperty("products");
        expect(typeof cache.products).toBe("object");
      }
    });
  });

  // Integration test - makes real API calls
  describe("runRefresh (integration)", () => {
    test.skipIf(!runLiveTests)("fetches and caches front month data", async () => {
      // This test makes real API calls - skip if no API key
      if (!process.env.MASSIVE_API_KEY) {
        console.log("Skipping: MASSIVE_API_KEY not set");
        return;
      }

      await frontMonthJob.runRefresh();

      const cache = frontMonthJob.getCache();
      const status = frontMonthJob.getStatus();

      expect(status.lastRunTime).not.toBeNull();
      expect(cache).not.toBeNull();

      if (cache) {
        expect(cache.lastUpdated).toBeGreaterThan(0);
        expect(Object.keys(cache.products).length).toBeGreaterThan(0);
      }
    }, 90000); // live provider sweep can take longer when snapshot coverage is wide
  });
});
