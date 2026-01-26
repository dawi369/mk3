#!/usr/bin/env bun
/**
 * Probe Redis Stream to see what symbols exist
 *
 * Usage: bun run dev_scripts/probe_stream.ts
 */

import { redisStore } from "@/server/data/redis_store.js";

async function probe() {
  console.log("🔍 Probing Redis Stream (market_data)...\n");

  // Get last 100 messages from stream
  const messages = await redisStore.redis.xrevrange(
    "market_data",
    "+",
    "-",
    "COUNT",
    100
  );

  console.log(`📊 Stream has ${messages.length} recent messages\n`);

  // Extract unique symbols
  const symbols = new Set<string>();
  
  for (const [id, fields] of messages) {
    // Fields are [key, value, key, value, ...]
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      if (key === "data" && value) {
        try {
          const data = JSON.parse(value);
          if (data.symbol) {
            symbols.add(data.symbol);
          }
        } catch {}
      }
    }
  }

  console.log(`📋 Unique symbols in stream (last 100 messages):`);
  const sortedSymbols = [...symbols].sort();
  
  // Group by prefix
  const byPrefix: Record<string, string[]> = {};
  for (const sym of sortedSymbols) {
    const prefix = sym.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, "");
    if (!byPrefix[prefix]) byPrefix[prefix] = [];
    byPrefix[prefix].push(sym);
  }

  for (const [prefix, syms] of Object.entries(byPrefix).sort()) {
    console.log(`   ${prefix}: ${syms.join(", ")}`);
  }

  console.log(`\n✅ Total unique symbols in stream: ${symbols.size}`);
  
  process.exit(0);
}

probe().catch((err) => {
  console.error("❌ Probe failed:", err);
  process.exit(1);
});
