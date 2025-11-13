import { edgeRedisClient } from './data/redis_client.js';
import { startEdgeRESTApi } from './rest/rest.js';
import { edgeWSServer } from './ws/server.js';

console.log('Starting Edge server...');

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

console.log('Edge server running\n');

// Log stats every 10 seconds
setInterval(() => {
  const redisStats = edgeRedisClient.getStats();
  const wsStats = edgeWSServer.getStats();
  console.log(
    `[Stats] Cache: ${redisStats.symbols} symbols, ${redisStats.totalBars} bars | ` +
    `WS: ${wsStats.totalClients} clients (${wsStats.realTimeClients} real-time, ${wsStats.delayedClients} delayed)`
  );
}, 10_000);

