/**
 * Quick test to verify front month job works correctly
 */

import { frontMonthJob } from "../jobs/front_month_job.js";

async function test() {
  console.log("Testing front month job...\n");

  await frontMonthJob.runRefresh();

  const cache = frontMonthJob.getCache();
  const status = frontMonthJob.getStatus();

  console.log("\n=== STATUS ===");
  console.log(status);

  console.log("\n=== CACHE ===");
  if (cache) {
    console.log(`Last updated: ${new Date(cache.lastUpdated).toISOString()}`);
    console.log(`Products: ${Object.keys(cache.products).length}`);

    console.log("\n=== ROLLING CONTRACTS ===");
    for (const [code, info] of Object.entries(cache.products)) {
      if (info.isRolling) {
        console.log(
          `${code}: ${info.nearestExpiry} -> ${
            info.frontMonth
          } (${info.volume.toLocaleString()} vol)`
        );
      }
    }
  }
}

test();
