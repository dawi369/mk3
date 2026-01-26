#!/usr/bin/env bun
/**
 * Test what symbols the schedule builder generates for each asset class
 *
 * Usage: bun run dev_scripts/test_schedule_builder.ts
 */

import { scheduleBuilder } from "@/utils/cbs/schedule_cb.js";

async function test() {
  console.log("🔍 Testing schedule builder for all asset classes...\n");

  const assetClasses = ["us_indices", "metals", "currencies", "grains", "softs", "volatiles"] as const;

  for (const ac of assetClasses) {
    console.log(`\n📂 ${ac.toUpperCase()}`);
    try {
      const request = await scheduleBuilder.buildRequestAsync(ac, "A");
      console.log(`   Symbols (${request.symbols.length}): ${request.symbols.join(", ")}`);
    } catch (err) {
      console.error(`   ❌ Error: ${err}`);
    }
  }

  console.log("\n✅ Done");
  process.exit(0);
}

test().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
