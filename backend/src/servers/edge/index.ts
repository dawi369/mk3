import { edgeRedisClient } from "@/servers/edge/data/redis_client.js";
import { startEdgeRESTApi } from "@/servers/edge/api/rest/rest_client.js";
import { edgeWSServer } from "@/servers/edge/api/ws/ws_client.js";

/**
 * Main Edge server startup
 * If Redis connection fails, process will exit and can be restarted
 */
async function startEdgeServer() {
  try {
    console.log("Starting Edge server...");

    // 1. Load today's snapshot from Redis
    await edgeRedisClient.loadTodaySnapshot();

    // 2. Subscribe to real-time feed via pub/sub
    await edgeRedisClient.subscribeToBars();

    // 3. Start REST API
    await startEdgeRESTApi();

    // 4. Start WebSocket server
    await edgeWSServer.start();

    // 5. Connect Redis bar stream to WebSocket broadcast
    edgeRedisClient.onBar((bar) => {
      edgeWSServer.broadcastBar(bar);
    });

    console.log("Edge server running\n");

    // Log stats every 10 seconds
    setInterval(() => {
      const redisStats = edgeRedisClient.getStats();
      const wsStats = edgeWSServer.getStats();
      console.log(
        `[Stats] Cache: ${redisStats.symbols} symbols, ${redisStats.totalBars} bars | ` +
          `WS: ${wsStats.totalClients} clients (${wsStats.realTimeClients} real-time, ${wsStats.delayedClients} delayed)`
      );
    }, 10_000);
  } catch (err) {
    console.error("Edge server startup failed:", err);
    console.error("Retrying in 3 seconds...");
    setTimeout(() => {
      startEdgeServer();
    }, 3000);
  }
}

// Handle process exit
process.on("SIGINT", () => {
  console.log("\nShutting down Edge server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down Edge server...");
  process.exit(0);
});

// Start server
startEdgeServer();
