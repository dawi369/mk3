import { PolygonWSClient } from "@/server/api/polygon/ws_client.js";
import { flowStore } from "@/server/data/flow_store.js";
import { redisStore } from "@/server/data/redis_store.js";
import { timescaleStore } from "@/server/data/timescale_store.js";
import type { PolygonMarketType } from "@/types/polygon.types.js";
import { startHubRESTApi } from "@/server/api/rest_client.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
// import { historySyncJob } from "@/jobs/sync_history.js";
import { scheduleBuilder } from "@/utils/cbs/schedule_cb.js";
import { POLYGON_ASSET_CLASS_LIST } from "@/utils/consts.js";

/**
 * Main Hub server startup
 * If Redis connection fails, process will exit and can be restarted
 */
async function startHubServer() {
  try {
    console.log("Starting Hub server...");

    // Initialize TimescaleDB
    await timescaleStore.init();

    const polygonClient = new PolygonWSClient();
    const futuresMarket: PolygonMarketType = "futures";

    await polygonClient.connect(futuresMarket);

    // Build requests dynamically using API
    console.log("Building subscription requests...");

    const usIndicesReq = await scheduleBuilder.buildRequestAsync("us_indices", "A");
    // const metalsReq = await scheduleBuilder.buildRequestAsync("metals", "A");
    // const currenciesReq = await scheduleBuilder.buildRequestAsync("currencies", "A");
    // const grainsReq = await scheduleBuilder.buildRequestAsync("grains", "A");
    // const softsReq = await scheduleBuilder.buildRequestAsync("softs", "A");
    // const volatilesReq = await scheduleBuilder.buildRequestAsync("volatiles", "A");

    await polygonClient.subscribe(usIndicesReq);
    // await polygonClient.subscribe(metalsReq);
    // await polygonClient.subscribe(currenciesReq);
    // await polygonClient.subscribe(grainsReq);
    // await polygonClient.subscribe(softsReq);

    // All in parallel
    // for (const cls of POLYGON_ASSET_CLASS_LIST) {
    //   const req = await scheduleBuilder.buildRequestAsync(cls, "A");
    //   await polygonClient.subscribe(req);
    // }

    // Brief pause before continuing
    await Bun.sleep(1000);

    // Load persisted job statuses
    await dailyClearJob.loadStatus();
    await monthlySubscriptionJob.loadStatus();

    // Schedule jobs
    // dailyClearJob.schedule();
    // monthlySubscriptionJob.schedule(polygonClient);
    // historySyncJob.schedule();

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
    }, 5000);
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
