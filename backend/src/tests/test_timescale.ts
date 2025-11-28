import { timescaleStore } from "@/server/data/timescale_store.js";
import { redisStore } from "@/server/data/redis_store.js";
import type { Bar } from "@/types/common.types.js";

async function runTest() {
  console.log("Initializing TimescaleStore...");
  await timescaleStore.init();

  const symbol = "TEST_TICKER";
  const now = Date.now();
  // Use a past month to test caching (e.g., last month)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const testTime = lastMonth.getTime();

  const testBar: Bar = {
    symbol: symbol,
    open: 100,
    high: 105,
    low: 95,
    close: 102,
    volume: 1000,
    trades: 50,
    startTime: testTime,
    endTime: testTime + 60000,
    dollarVolume: 102000,
  };

  console.log("Inserting test bar:", testBar);
  await timescaleStore.insertBar(testBar);

  // Wait a bit for DB consistency
  await Bun.sleep(1000);

  console.log("Querying history (First run - DB hit)...");
  const start = Date.now();
  const history1 = await timescaleStore.getHistory(
    symbol,
    testTime - 1000,
    testTime + 60000
  );
  const end1 = Date.now();
  console.log(`Result 1 (${end1 - start}ms):`, history1.length, "bars");

  if (history1.length !== 1) {
    console.error("FAILED: Expected 1 bar, got", history1.length);
  } else {
    console.log("Matched:", history1[0]);
  }

  console.log("Querying history (Second run - Cache hit expected)...");
  const start2 = Date.now();
  const history2 = await timescaleStore.getHistory(
    symbol,
    testTime - 1000,
    testTime + 60000
  );
  const end2 = Date.now();
  console.log(`Result 2 (${end2 - start2}ms):`, history2.length, "bars");

  if (history2.length !== 1) {
    console.error("FAILED: Expected 1 bar, got", history2.length);
  }

  console.log("Cleaning up...");
  // Optional: Delete test data
  // await redisStore.redis.del(`history:${symbol}:...`);

  await timescaleStore.close();
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
