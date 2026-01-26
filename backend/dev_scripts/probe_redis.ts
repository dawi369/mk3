#!/usr/bin/env bun
/**
 * Probe Redis to see what symbols are stored
 *
 * Usage: bun run dev_scripts/probe_redis.ts
 */

import { redisStore } from "@/server/data/redis_store.js";

async function probe() {
  console.log("🔍 Probing Redis...\n");

  const symbols = await redisStore.getSymbols();
  const stats = await redisStore.getStats();

  console.log("📊 Stats:");
  console.log(`   Symbol count: ${stats.symbolCount}`);
  console.log(`   Bar count: ${stats.barCount}`);
  console.log(`   Date: ${stats.date}`);

  console.log("\n📋 All symbols in bar:latest:");
  
  // Group by prefix for easier reading
  const byPrefix: Record<string, string[]> = {};
  
  for (const sym of symbols.sort()) {
    // Extract prefix (first 2-3 chars before month code)
    const prefix = sym.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, "");
    if (!byPrefix[prefix]) byPrefix[prefix] = [];
    byPrefix[prefix].push(sym);
  }

  for (const [prefix, syms] of Object.entries(byPrefix).sort()) {
    console.log(`   ${prefix}: ${syms.join(", ")}`);
  }

  console.log(`\n✅ Total: ${symbols.length} symbols`);
  
  process.exit(0);
}

probe().catch((err) => {
  console.error("❌ Probe failed:", err);
  process.exit(1);
});
