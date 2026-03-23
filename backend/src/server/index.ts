import { PolygonWSClient } from "@/server/api/polygon/ws_client.js";
import { redisStore } from "@/server/data/redis_store.js";
import { timescaleStore } from "@/server/data/timescale_store.js";
import type { PolygonMarketType } from "@/types/polygon.types.js";
import { startHubRESTApi } from "@/server/api/rest_client.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
import { frontMonthJob } from "@/jobs/front_month_job.js";
import { snapshotJob } from "@/jobs/snapshot_job.js";
import { scheduleBuilder } from "@/utils/cbs/schedule_cb.js";

// Global reference for graceful shutdown
let polygonClient: PolygonWSClient | null = null;
let statsInterval: Timer | null = null;

/**
 * Main Hub server startup
 * If Redis connection fails, process will exit and can be restarted
 */
async function startHubServer() {
  try {
    console.log("Starting Hub server...");

    await redisStore.ping();

    if (timescaleStore.isEnabled) {
      await timescaleStore.init();
    } else {
      console.log("TimescaleDB disabled for current runtime");
    }

    polygonClient = new PolygonWSClient();
    const futuresMarket: PolygonMarketType = "futures";

    await polygonClient.connect(futuresMarket);

    // Build requests dynamically using API
    console.log("Building subscription requests...");

    const usIndicesReq = await scheduleBuilder.buildRequestAsync("us_indices", "A");
    const metalsReq = await scheduleBuilder.buildRequestAsync("metals", "A");
    const currenciesReq = await scheduleBuilder.buildRequestAsync("currencies", "A");
    const grainsReq = await scheduleBuilder.buildRequestAsync("grains", "A");
    const softsReq = await scheduleBuilder.buildRequestAsync("softs", "A");
    const volatilesReq = await scheduleBuilder.buildRequestAsync("volatiles", "A");

    await polygonClient.subscribe(usIndicesReq);
    await polygonClient.subscribe(metalsReq);
    await polygonClient.subscribe(currenciesReq);
    await polygonClient.subscribe(grainsReq);
    await polygonClient.subscribe(softsReq);
    await polygonClient.subscribe(volatilesReq);

    monthlySubscriptionJob.attachClient(polygonClient);
    await redisStore.setSubscribedSymbols(
      polygonClient
        .getSubscriptions()
        .flatMap((subscription) => subscription.symbols),
    );

    // Brief pause before continuing
    await Bun.sleep(1000);

    // Load persisted job statuses
    await dailyClearJob.loadStatus();
    await monthlySubscriptionJob.loadStatus();
    await frontMonthJob.loadStatus();
    await snapshotJob.loadStatus();

    // TODO: Enable job scheduling in production
    // dailyClearJob.schedule();
    // monthlySubscriptionJob.schedule(polygonClient);
    // snapshotJob.schedule();

    // Start Hub REST API (pass polygon client for subscription management)
    await startHubRESTApi(polygonClient);

    console.log("Hub server running\n");

    // Log stats every 5 seconds
    statsInterval = setInterval(async () => {
      const stats = await redisStore.getStats();
      console.log(
        `[Stats] Date: ${stats.date} | Symbols: ${stats.symbolCount} | Bars: ${stats.barCount}`,
      );
    }, 5000);
  } catch (err) {
    console.error("Hub server startup failed:", err);
    const retrySeconds = 10;
    console.error(`Retrying in ${retrySeconds} seconds...`);
    setTimeout(() => {
      startHubServer();
    }, retrySeconds * 1000);
  }
}

/**
 * Graceful shutdown - cleanup all connections
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n[${signal}] Graceful shutdown initiated...`);

  // Stop stats logging
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }

  // Disconnect Polygon WebSocket
  if (polygonClient) {
    console.log("Disconnecting Polygon WebSocket...");
    polygonClient.disconnect();
    polygonClient = null;
  }

  // Close TimescaleDB connections
  console.log("Closing TimescaleDB connections...");
  await timescaleStore.close();

  // Close Redis connection
  console.log("Closing Redis connection...");
  await redisStore.redis.quit();

  console.log("Shutdown complete.");
  process.exit(0);
}

// Handle process exit signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Start server
startHubServer();
