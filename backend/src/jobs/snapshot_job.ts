import { CronJob } from "cron";
import { redisStore } from "@/server/data/redis_store.js";
import { POLYGON_API_KEY } from "@/config/env.js";
import type { SnapshotData } from "@/types/common.types.js";
import type { PolygonSnapshotResponse } from "@/types/front_month.types.js";

const POLYGON_SNAPSHOT_URL = "https://api.polygon.io/futures/vX/snapshot";
const REDIS_STATUS_KEY = "job:snapshot:status";

interface SnapshotJobStatus {
  lastRunTime: number | null;
  lastSuccess: boolean;
  lastError: string | null;
  symbolsUpdated: number;
  totalRuns: number;
}

/**
 * Fetch snapshot for a specific ticker from Polygon
 */
async function fetchTickerSnapshot(
  ticker: string
): Promise<SnapshotData | null> {
  const url = `${POLYGON_SNAPSHOT_URL}?ticker=${ticker}&apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as PolygonSnapshotResponse;

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn(`[SnapshotJob] No snapshot data for ${ticker}`);
      return null;
    }

    const contract = data.results[0];
    if (!contract) return null;

    const session = contract.session || {};

    // Parse settlement_date - can be string (YYYY-MM-DD) or number (ns/ms)
    let settlementDate = "";
    const rawDate = contract.details.settlement_date;
    if (typeof rawDate === "string") {
      settlementDate = rawDate;
    } else if (typeof rawDate === "number") {
      // Try nanoseconds first (very large number), then milliseconds
      const ms = rawDate > 1e15 ? rawDate / 1_000_000 : rawDate;
      const date = new Date(ms);
      if (!isNaN(date.getTime())) {
        settlementDate = date.toISOString().split("T")[0]!;
      }
    }

    return {
      productCode: contract.details.product_code || "",
      settlementDate,
      sessionOpen: session.open || 0,
      sessionHigh: session.high || 0,
      sessionLow: session.low || 0,
      sessionClose: session.close || 0,
      settlementPrice: session.settlement_price || 0,
      prevSettlement: session.previous_settlement || 0,
      change: session.change || 0,
      changePct: session.change_percent || 0,
      openInterest: contract.open_interest || null,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`[SnapshotJob] Error fetching snapshot for ${ticker}:`, error);
    return null;
  }
}

class SnapshotJob {
  private status: SnapshotJobStatus = {
    lastRunTime: null,
    lastSuccess: false,
    lastError: null,
    symbolsUpdated: 0,
    totalRuns: 0,
  };

  async loadStatus(): Promise<void> {
    try {
      const saved = await redisStore.redis.get(REDIS_STATUS_KEY);
      if (saved) {
        this.status = JSON.parse(saved);
        console.log(
          `[SnapshotJob] Loaded status: ${this.status.totalRuns} runs, last: ${
            this.status.lastRunTime
              ? new Date(this.status.lastRunTime).toISOString()
              : "never"
          }`
        );
      }
    } catch (err) {
      console.error("[SnapshotJob] Failed to load status:", err);
    }
  }

  private async saveStatus(): Promise<void> {
    try {
      await redisStore.redis.set(REDIS_STATUS_KEY, JSON.stringify(this.status));
    } catch (err) {
      console.error("[SnapshotJob] Failed to save status:", err);
    }
  }

  /**
   * Fetch and store snapshots for all active symbols
   */
  async runRefresh(): Promise<void> {
    console.log("--- SnapshotJob ---");
    console.log("[SnapshotJob] Running snapshot refresh...");

    this.status.totalRuns++;
    this.status.lastRunTime = Date.now();

    try {
      // Get list of active symbols from bar:latest
      const symbols = await redisStore.getSymbols();

      if (symbols.length === 0) {
        console.log("[SnapshotJob] No active symbols found");
        this.status.lastSuccess = true;
        this.status.symbolsUpdated = 0;
        await this.saveStatus();
        return;
      }

      console.log(`[SnapshotJob] Fetching snapshots for ${symbols.length} symbols`);

      let updated = 0;
      for (const symbol of symbols) {
        const snapshot = await fetchTickerSnapshot(symbol);

        if (snapshot) {
          await redisStore.writeSnapshot(symbol, snapshot);
          updated++;
          console.log(
            `[SnapshotJob] ${symbol}: prevSettlement=${snapshot.prevSettlement}, settlement=${snapshot.settlementPrice}`
          );
        }

        // Rate limiting: 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.status.lastSuccess = true;
      this.status.lastError = null;
      this.status.symbolsUpdated = updated;

      await this.saveStatus();

      console.log(`[SnapshotJob] Completed: ${updated}/${symbols.length} symbols updated`);
      console.log("");
    } catch (err) {
      this.status.lastSuccess = false;
      this.status.lastError = err instanceof Error ? err.message : String(err);
      await this.saveStatus();
      console.error("[SnapshotJob] Failed:", err);
    }
  }

  getStatus(): SnapshotJobStatus {
    return { ...this.status };
  }

  /**
   * Schedule job to run at 2:05 AM ET (after daily clear at 2:00 AM)
   */
  schedule(): void {
    new CronJob(
      "5 2 * * *",
      async () => {
        await this.runRefresh();
      },
      null,
      true,
      "America/New_York"
    );

    console.log("[SnapshotJob] Scheduled (2:05 AM ET daily)");
  }
}

export const snapshotJob = new SnapshotJob();
