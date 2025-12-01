import { Redis } from "ioredis";

const redis = new Redis({
  host: "localhost",
  port: 6379,
});

async function checkRedis() {
  console.log("Checking Redis...");

  // Check stream length
  const streamLen = await redis.xlen("market_data");
  console.log(`Stream 'market_data' length: ${streamLen}`);

  // Get last 3 entries
  if (streamLen > 0) {
    const entries = await redis.xrange("market_data", "-", "+", "COUNT", 3);
    console.log("\nLast 3 entries:");
    for (const [id, fields] of entries) {
      console.log(`ID: ${id}`);
      const data: Record<string, any> = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }
      console.log(`Data:`, data);
    }
  }

  // Check bar keys
  const barKeys = await redis.keys("bar:*");
  console.log(`\nTotal bar:* keys: ${barKeys.length}`);
  console.log("First 10:", barKeys.slice(0, 10));

  await redis.quit();
}

checkRedis().catch(console.error);
