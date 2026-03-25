import { describe, test, expect } from "bun:test";
import { MASSIVE_API_KEY } from "@/config/env.js";
import activeMonthsData from "../../tickers/active_months.json" with { type: "json" };

/**
 * Verifies that the tickers configured in active_months.json are valid 
 * and have active contracts on Massive.
 * 
 * Run with: bun test src/tests/active_tickers.test.ts
 */

const MONTHS = ["F", "G", "H", "J", "K", "M", "N", "Q", "U", "V", "X", "Z"];
// Dynamically get current year suffix (e.g. "6" for 2026)
const YEAR = String(new Date().getFullYear() % 10);
const runLiveTests = Bun.env.RUN_LIVE_TESTS === "1";

describe("Active Tickers Configuration", () => {
  // Flatten tickers from the configuration
  const allTickers: { category: string; ticker: string; months: string[] }[] = [];
  
  for (const [category, tickers] of Object.entries(activeMonthsData.FUTURES_ACTIVE_MONTHS)) {
    for (const [ticker, months] of Object.entries(tickers)) {
      allTickers.push({ category, ticker, months: months as string[] });
    }
  }

  test("all tickers have valid month codes", () => {
    for (const { ticker, months } of allTickers) {
      for (const month of months) {
        expect(MONTHS).toContain(month);
      }
    }
  });

  // This test makes network requests, so we skip it by default unless explicitly asking for it
  // or we can run it but warn it might be slow. 
  // For CI/CD, we might want to mock this or separate it.
  test.skipIf(!runLiveTests)("tickers fetch successfully from Massive", async () => {
    // Only test a subset to avoid rate limits/slow tests, or test all if needed
    // Testing just the first ticker of each category as a sanity check
    const categoriesProcessed = new Set<string>();
    
    for (const { category, ticker, months } of allTickers) {
      if (categoriesProcessed.has(category)) continue;
      
      // Construct a likely valid contract (current year + first configured month)
      // Note: This relies on the month being valid for the current year, which isn't guaranteed 
      // (e.g. Z5 ended, now we are in 2026). 
      // A better check is finding the *next* valid contract.
      
      // Simple check: just verifying the root ticker active active contracts
      const url = `https://api.massive.com/futures/vX/contracts?product_code=${ticker}&active=true&apiKey=${MASSIVE_API_KEY}&limit=1`;
      
      try {
        const response = await fetch(url);
        expect(response.status).toBe(200);
        
        const data = await response.json() as any;
        // Should have at least one active contract
        if (data.results && data.results.length > 0) {
           categoriesProcessed.add(category);
        } else {
            console.warn(`Warning: No active contracts found for ${ticker} (Category: ${category})`);
        }
      } catch (err) {
        console.error(`Failed to check ${ticker}:`, err);
        throw err;
      }
    }
    
    expect(categoriesProcessed.size).toBeGreaterThan(0);
  }, 20000); // active contracts fetch can be slow
});
