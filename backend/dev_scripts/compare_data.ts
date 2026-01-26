#!/usr/bin/env bun
/**
 * Compare bar:latest timestamps with stream data to find the issue
 *
 * Usage: bun run dev_scripts/compare_data.ts
 */

import { redisStore } from "@/server/data/redis_store.js";

async function compare() {
  console.log("🔍 Comparing bar:latest vs market_data stream...\n");

  // Get all symbols and their latest bar
  const allLatest = await redisStore.getAllLatest();
  
  // Get last 200 stream messages
  const streamMessages = await redisStore.redis.xrevrange(
    "market_data",
    "+",
    "-",
    "COUNT",
    200
  );

  // Extract symbols and timestamps from stream
  const streamSymbols = new Set<string>();
  let oldestStreamTime = Infinity;
  let newestStreamTime = 0;
  
  for (const [id, fields] of streamMessages) {
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      if (key === "data" && value) {
        try {
          const data = JSON.parse(value);
          if (data.symbol) {
            streamSymbols.add(data.symbol);
            if (data.endTime) {
              oldestStreamTime = Math.min(oldestStreamTime, data.endTime);
              newestStreamTime = Math.max(newestStreamTime, data.endTime);
            }
          }
        } catch {}
      }
    }
  }

  // Categorize symbols
  const inBoth: string[] = [];
  const onlyInHash: string[] = [];
  const onlyInStream: string[] = [];

  for (const symbol of Object.keys(allLatest)) {
    if (streamSymbols.has(symbol)) {
      inBoth.push(symbol);
    } else {
      onlyInHash.push(symbol);
    }
  }

  for (const symbol of streamSymbols) {
    if (!allLatest[symbol]) {
      onlyInStream.push(symbol);
    }
  }

  console.log("📊 Stream statistics:");
  console.log(`   Messages: ${streamMessages.length}`);
  console.log(`   Time range: ${new Date(oldestStreamTime).toISOString()} - ${new Date(newestStreamTime).toISOString()}`);
  
  console.log(`\n📋 Symbols in BOTH hash and stream (${inBoth.length}):`);
  console.log(`   ${inBoth.sort().join(", ")}`);
  
  console.log(`\n⚠️  Symbols ONLY in bar:latest hash (${onlyInHash.length}):`);
  for (const symbol of onlyInHash.sort()) {
    const bar = allLatest[symbol];
    console.log(`   ${symbol}: endTime=${new Date(bar!.endTime).toISOString()}`);
  }
  
  if (onlyInStream.length > 0) {
    console.log(`\n⚠️  Symbols ONLY in stream (${onlyInStream.length}):`);
    console.log(`   ${onlyInStream.sort().join(", ")}`);
  }

  // Check if hash-only symbols have old timestamps (seeded data)
  console.log("\n📅 Analysis:");
  const now = Date.now();
  let seededCount = 0;
  let recentCount = 0;
  
  for (const symbol of onlyInHash) {
    const bar = allLatest[symbol];
    const age = now - bar!.endTime;
    if (age > 24 * 60 * 60 * 1000) { // older than 24h
      seededCount++;
    } else {
      recentCount++;
    }
  }
  
  console.log(`   Hash-only symbols older than 24h (likely seeded): ${seededCount}`);
  console.log(`   Hash-only symbols from last 24h: ${recentCount}`);
  
  process.exit(0);
}

compare().catch((err) => {
  console.error("❌ Compare failed:", err);
  process.exit(1);
});
