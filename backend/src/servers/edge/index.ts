import { edgeRedisClient } from './data/redis_client.js';

console.log('Starting Edge server...');

// 1. Load today's snapshot from Redis
await edgeRedisClient.loadTodaySnapshot();

// 2. Subscribe to real-time feed via pub/sub
await edgeRedisClient.subscribeToBars();

console.log('Edge server running\n');

// Log stats every 10 seconds
setInterval(() => {
  const stats = edgeRedisClient.getStats();
  console.log(`[Stats] ${stats.symbols} symbols | ${stats.totalBars} total bars`);
}, 10_000);

