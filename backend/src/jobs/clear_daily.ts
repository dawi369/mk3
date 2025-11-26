import cron from "node-cron";
import { redisStore } from "@/server/data/redis_store.js";

interface ClearJobStatus {
  lastRunTime: number | null;
  lastSuccess: boolean;
  lastError: string | null;
  clearedKeys: number;
  totalRuns: number;
}

class DailyClearJob {
  private status: ClearJobStatus = {
    lastRunTime: null,
    lastSuccess: false,
    lastError: null,
    clearedKeys: 0,
    totalRuns: 0,
  };

  async loadStatus(): Promise<void> {
    try {
      const saved = await redisStore.redis.get("job:clear:status");
      if (saved) {
        this.status = JSON.parse(saved);
        console.log(
          `Loaded clear job status: ${this.status.totalRuns} runs, last: ${
            this.status.lastRunTime
              ? new Date(this.status.lastRunTime).toISOString()
              : "never"
          }`
        );
      }
    } catch (err) {
      console.error("Failed to load clear job status:", err);
    }
  }

  private async saveStatus(): Promise<void> {
    try {
      await redisStore.redis.set(
        "job:clear:status",
        JSON.stringify(this.status)
      );
    } catch (err) {
      console.error("Failed to save clear job status:", err);
    }
  }

  async runClear(): Promise<void> {
    console.log("--- DailyClearJob ---");
    console.log("Running daily Redis clear job...");
    this.status.totalRuns++;
    this.status.lastRunTime = Date.now();

    try {
      const result = await redisStore.clearTodayData();

      this.status.lastSuccess = true;
      this.status.lastError = null;
      this.status.clearedKeys = result.cleared;

      await this.saveStatus();

      console.log(
        `Daily clear completed: ${result.cleared} keys cleared, new date: ${result.newDate}`
      );
      console.log("");
    } catch (err) {
      this.status.lastSuccess = false;
      this.status.lastError = err instanceof Error ? err.message : String(err);

      await this.saveStatus();

      console.error("Daily clear job failed:", err);
    }
  }

  getStatus(): ClearJobStatus {
    return { ...this.status };
  }

  schedule(): void {
    cron.schedule(
      "0 2 * * *",
      async () => {
        await this.runClear();
      },
      {
        timezone: "America/New_York",
      }
    );

    console.log("Daily clear job scheduled (2 AM ET)");
  }
}

export const dailyClearJob = new DailyClearJob();
