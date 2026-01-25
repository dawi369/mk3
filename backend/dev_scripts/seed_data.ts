#!/usr/bin/env bun
/**
 * Seed fake bar data into Redis for testing
 *
 * Usage: bun run dev_scripts/seed_data.ts
 *
 * Seeds 4 tickers per asset class with 10 bars each
 * Product codes match frontend/tickers/*.json
 */

import { redisStore } from "@/server/data/redis_store.js";
import type { Bar } from "@/types/common.types.js";

// All 6 asset classes - product codes from frontend/tickers/*.json
const TICKERS = {
  // US Indices (from us_indices.json: ES, NQ, YM, RTY)
  us_indices: ["ESH25", "NQH25", "YMH25", "RTYH25"],

  // Metals (from metals.json: GC, SI, HG, PA)
  metals: ["GCJ25", "SIH25", "HGH25", "PAH25"],

  // Currencies (from currencies.json: 6E, 6J, 6B, 6A)
  currencies: ["6EH25", "6JH25", "6BH25", "6AH25"],

  // Grains (from grains.json: ZC, ZS, ZW, ZM)
  grains: ["ZCH25", "ZSH25", "ZWH25", "ZMH25"],

  // Softs (from softs.json: KT=Coffee, CJ=Cocoa, TT=Cotton, YO=Sugar)
  softs: ["KTH25", "CJH25", "TTH25", "YOH25"],

  // Volatiles (from volatiles.json: CL=Crude, BZ=Brent, NG=NatGas, LE=Cattle)
  volatiles: ["CLH25", "BZH25", "NGH25", "LEH25"],
};

// Realistic base prices by symbol
const BASE_PRICES: Record<string, number> = {
  // US Indices
  ESH25: 5850.0,
  NQH25: 20500.0,
  YMH25: 42500.0,
  RTYH25: 2050.0,

  // Metals
  GCJ25: 2650.0,
  SIH25: 31.5,
  HGH25: 4.25,
  PAH25: 1050.0,

  // Currencies
  "6EH25": 1.085,
  "6JH25": 0.0067,
  "6BH25": 1.27,
  "6AH25": 0.655,

  // Grains
  ZCH25: 485.0,
  ZSH25: 1025.0,
  ZWH25: 565.0,
  ZMH25: 305.0,

  // Softs (NYMEX codes)
  KTH25: 185.0,   // Coffee
  CJH25: 4500.0,  // Cocoa
  TTH25: 78.5,    // Cotton
  YOH25: 21.5,    // Sugar

  // Volatiles (energy/livestock)
  CLH25: 72.50,   // Crude Oil
  BZH25: 76.25,   // Brent
  NGH25: 3.15,    // Natural Gas
  LEH25: 185.50,  // Live Cattle
};

function getBasePrice(symbol: string): number {
  return BASE_PRICES[symbol] || 100.0;
}

function generateBar(symbol: string, index: number): Bar {
  const now = Date.now();
  const basePrice = getBasePrice(symbol);
  const variance = basePrice * 0.002;

  const open = basePrice + (Math.random() - 0.5) * variance;
  const close = open + (Math.random() - 0.5) * variance;
  const high = Math.max(open, close) + Math.random() * variance * 0.5;
  const low = Math.min(open, close) - Math.random() * variance * 0.5;

  return {
    symbol,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume: Math.floor(Math.random() * 1000) + 100,
    trades: Math.floor(Math.random() * 50) + 10,
    startTime: now - (10 - index) * 60000,
    endTime: now - (10 - index - 1) * 60000,
    dollarVolume: Math.floor(Math.random() * 1000000),
  };
}

async function seed() {
  console.log("🌱 Seeding fake data for all 6 asset classes...\n");

  let totalBars = 0;
  let totalSymbols = 0;

  for (const [assetClass, tickers] of Object.entries(TICKERS)) {
    console.log(`\n📂 ${assetClass.toUpperCase()}`);

    for (const symbol of tickers) {
      for (let i = 0; i < 10; i++) {
        const bar = generateBar(symbol, i);
        await redisStore.writeBar(bar);
        totalBars++;
      }

      const latest = await redisStore.getLatest(symbol);
      console.log(`   📊 ${symbol}: ${latest?.close}`);
      totalSymbols++;
    }
  }

  console.log(`\n✅ Done! Seeded ${totalBars} bars for ${totalSymbols} symbols`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
