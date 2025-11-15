import cron from "node-cron";
import { redisStore } from "@/servers/hub/data/redis_store.js";
import type { PolygonWSClient } from "@/api/polygon/ws_client.js";
import type {
  PolygonAssetClass,
  PolygonWsRequest,
} from "@/types/polygon.types.js";
import type {
  RefreshJobStatus,
  RefreshDetails,
} from "@/types/common.types.js";
import { quarterlyBuilder } from "@/utils/cbs/quarterly_cb.js";
import { SUBSCRIPTION_CONFIG } from "@/config/subscriptions.js";

class MonthlySubscriptionJob {
  private wsClient: PolygonWSClient | null = null;
  private status: RefreshJobStatus = {
    lastRunTime: null,
    lastSuccess: false,
    lastError: null,
    lastRefreshDetails: [],
    totalRuns: 0,
  };

  async loadStatus(): Promise<void> {
    try {
      const saved = await redisStore.redis.get("job:refresh:status");
      if (saved) {
        this.status = JSON.parse(saved);
        console.log(
          `Loaded refresh job status: ${this.status.totalRuns} runs, last: ${
            this.status.lastRunTime
              ? new Date(this.status.lastRunTime).toISOString()
              : "never"
          }`
        );
      }
    } catch (err) {
      console.error("Failed to load refresh job status:", err);
    }
  }

  private async saveStatus(): Promise<void> {
    try {
      await redisStore.redis.set(
        "job:refresh:status",
        JSON.stringify(this.status)
      );
    } catch (err) {
      console.error("Failed to save refresh job status:", err);
    }
  }

  private shouldRefreshIndices(): boolean {
    const now = new Date();
    const month = now.getMonth() + 1; // Jan = 1
    return [3, 6, 9, 12].includes(month); // Mar, Jun, Sep, Dec
  }

  private shouldRefreshMetals(): boolean {
    // Metals roll quarterly, check quarterly months
    const now = new Date();
    const month = now.getMonth() + 1; // Jan = 1
    return [3, 6, 9, 12].includes(month); // Mar, Jun, Sep, Dec
  }

  private findSubscriptionByAssetClass(
    subscriptions: PolygonWsRequest[],
    assetClass: PolygonAssetClass,
    eventType: "A" | "AM"
  ): PolygonWsRequest | undefined {
    return subscriptions.find(
      (sub) => sub.assetClass === assetClass && sub.ev === eventType
    );
  }

  private async refreshAssetClass(
    assetClass: PolygonAssetClass,
    eventType: "A" | "AM"
  ): Promise<RefreshDetails> {
    const details: RefreshDetails = {
      assetClass,
      eventType,
      oldSymbols: [],
      newSymbols: [],
      changed: false,
      success: false,
    };

    try {
      if (!this.wsClient) {
        throw new Error("WS client not initialized");
      }

      // Build new request based on asset class
      let newRequest: PolygonWsRequest;
      if (assetClass === "us_indices") {
        newRequest = quarterlyBuilder.buildQuarterlyRequest(
          assetClass,
          eventType,
          SUBSCRIPTION_CONFIG.US_INDICES_QUARTERS
        );
      } else {
        newRequest = quarterlyBuilder.buildQuarterlyRequest(
          assetClass,
          eventType,
          SUBSCRIPTION_CONFIG.METALS_QUARTERS
        );
      }

      details.newSymbols = newRequest.symbols;

      // Find current subscription for this asset class
      const currentSubscriptions = this.wsClient.getSubscriptions();
      const currentSub = this.findSubscriptionByAssetClass(
        currentSubscriptions,
        assetClass,
        eventType
      );

      if (currentSub) {
        details.oldSymbols = currentSub.symbols;

        // Compare symbols
        const oldSymbolsSet = new Set(currentSub.symbols.sort());
        const newSymbolsSet = new Set(newRequest.symbols.sort());

        const oldStr = Array.from(oldSymbolsSet).join(",");
        const newStr = Array.from(newSymbolsSet).join(",");

        if (oldStr !== newStr) {
          details.changed = true;
          console.log(
            `[${assetClass}/${eventType}] Symbols changed, updating subscription...`
          );
          console.log(`  Old: ${currentSub.symbols.join(", ")}`);
          console.log(`  New: ${newRequest.symbols.join(", ")}`);

          await this.wsClient.updateSubscription(currentSub, newRequest);
          details.success = true;
        } else {
          console.log(`[${assetClass}/${eventType}] No change needed`);
          details.success = true;
        }
      } else {
        // No existing subscription, just subscribe
        details.changed = true;
        console.log(
          `[${assetClass}/${eventType}] No existing subscription, subscribing...`
        );
        await this.wsClient.subscribe(newRequest);
        details.success = true;
      }
    } catch (err) {
      details.success = false;
      details.error = err instanceof Error ? err.message : String(err);
      console.error(`[${assetClass}/${eventType}] Refresh failed:`, err);
    }

    return details;
  }

  async runRefresh(): Promise<void> {
    console.log("\n--- MonthlySubscriptionJob ---");
    console.log("Running subscription refresh job...");

    this.status.totalRuns++;
    this.status.lastRunTime = Date.now();
    this.status.lastRefreshDetails = [];

    const refreshTasks: Promise<RefreshDetails>[] = [];

    // Check US indices (quarterly)
    if (this.shouldRefreshIndices()) {
      console.log("US Indices: Refresh needed (quarterly month)");
      refreshTasks.push(this.refreshAssetClass("us_indices", "A"));
      // Uncomment when subscribing to minute data:
      // refreshTasks.push(this.refreshAssetClass('us_indices', 'AM'));
    } else {
      console.log("US Indices: No refresh needed (not a quarterly month)");
    }

    // Check metals (quarterly)
    if (this.shouldRefreshMetals()) {
      console.log("Metals: Refresh needed (quarterly month)");
      refreshTasks.push(this.refreshAssetClass("metals", "A"));
      // Uncomment when subscribing to minute data:
      // refreshTasks.push(this.refreshAssetClass('metals', 'AM'));
    } else {
      console.log("Metals: No refresh needed (not a quarterly month)");
    }

    // Execute all refreshes
    const results = await Promise.all(refreshTasks);
    this.status.lastRefreshDetails = results;

    // Determine overall success (partial success if any succeeded)
    const anySuccess = results.some((r) => r.success);
    const anyFailure = results.some((r) => !r.success);

    if (anyFailure) {
      const errors = results
        .filter((r) => !r.success)
        .map((r) => r.error)
        .join("; ");
      this.status.lastError = errors;
      this.status.lastSuccess = anySuccess; // Partial success if at least one succeeded
      console.log(`⚠️  Refresh completed with failures: ${errors}`);
    } else {
      this.status.lastError = null;
      this.status.lastSuccess = true;
      console.log("✓ Refresh completed successfully");
    }

    await this.saveStatus();

    // Summary
    const changedCount = results.filter((r) => r.changed).length;
    const successCount = results.filter((r) => r.success).length;
    console.log(
      `Summary: ${successCount}/${results.length} successful, ${changedCount} changed`
    );
    console.log("-----------------------------------\n");
    console.log("");
  }

  getStatus(): RefreshJobStatus {
    return { ...this.status };
  }

  schedule(wsClient: PolygonWSClient): void {
    this.wsClient = wsClient;

    // Run at 00:05 ET on the 1st of every month
    cron.schedule(
      "5 0 1 * *",
      async () => {
        await this.runRefresh();
      },
      {
        timezone: "America/New_York",
      }
    );

    console.log(
      "Monthly subscription refresh job scheduled (1st of month @ 00:05 ET)"
    );
  }
}

export const monthlySubscriptionJob = new MonthlySubscriptionJob();
