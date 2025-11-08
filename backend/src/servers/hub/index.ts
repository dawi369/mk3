import { PolygonWSClient } from "@/api/polygon/ws_client.js";
import { flowStore } from "@/data/flow_store.js";
import { redisStore } from "@/data/redis_store.js";
import type { PolygonMarketType } from "@/utils/types.js";
import { futuresSecondRequest } from "@/utils/consts.js";

const client = new PolygonWSClient();
const futuresMarket: PolygonMarketType = "futures";

// Test Redis connection
// console.log("Testing Redis connection...");
// const pingResult = await redisStore.ping();
// console.log("Redis ping:", pingResult);

await client.connect(futuresMarket);
await client.subscribe(futuresSecondRequest);

setInterval(async () => {
  console.log("--- flowStore ---");
  console.log("Symbols:", flowStore.getSymbols());
  console.log("Latest bars:", flowStore.getAllLatest().length);
  
  console.log("\n--- Redis ---");
  const stats = await redisStore.getStats();
  console.log("Stats:", stats);
  
  // Test reading one symbol from Redis
  const symbols = flowStore.getSymbols();
  if (symbols.length > 0 && symbols[0]) {
    const symbol = symbols[0];
    const latest = await redisStore.getLatest(symbol);
    console.log(`Latest ${symbol} from Redis:`, latest);
  }
  
  console.log("-----------------------------------\n");
}, 5_000);

// setInterval(async () => {
//     const health = await client.getHealth();
//     console.log('Health:', health);
// }, 5_000);
