import { PolygonWSClient } from "@/api/polygon/ws_client.js";
import { flowStore } from "@/servers/hub/data/flow_store.js";
import { redisStore } from "@/servers/hub/data/redis_store.js";
import type { PolygonMarketType } from "@/utils/polygon_types.js";
import { startHubRESTApi } from "@/servers/hub/api/rest_client.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
import {
  futuresUSIndicesSecondsRequest,
  futuresMetalsSecondsRequests,
} from "@/utils/consts.js";

/**
 * Main Hub server startup
 * If Redis connection fails, process will exit and can be restarted
 */
async function startHubServer() {
  try {
    console.log("Starting Hub server...");

    const polygonClient = new PolygonWSClient();
    const futuresMarket: PolygonMarketType = "futures";

    await polygonClient.connect(futuresMarket);

    await polygonClient.subscribe(futuresUSIndicesSecondsRequest);
    await polygonClient.subscribe(futuresMetalsSecondsRequests);

    // Load persisted job statuses
    await dailyClearJob.loadStatus();
    await monthlySubscriptionJob.loadStatus();

    // Schedule jobs
    dailyClearJob.schedule();
    monthlySubscriptionJob.schedule(polygonClient);

    // Start Hub REST API (pass polygon client for subscription management)
    await startHubRESTApi(polygonClient);

    console.log("Hub server running\n");

    // Log stats every 5 seconds
    setInterval(async () => {
      console.log("--- flowStore ---");
      console.log("Symbols:", flowStore.getSymbols());
      console.log("Latest bars:", flowStore.getAllLatest().length);

      console.log("\n--- Redis ---");
      const stats = await redisStore.getStats();
      console.log("Stats:", stats);

      console.log("-----------------------------------\n");
    }, 5_000);
  } catch (err) {
    console.error("Hub server startup failed:", err);
    console.error("Retrying in 10 seconds...");
    setTimeout(() => {
      startHubServer();
    }, 19000);
  }
}

// Handle process exit
process.on("SIGINT", () => {
  console.log("\nShutting down Hub server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down Hub server...");
  process.exit(0);
});

// Start server
startHubServer();
