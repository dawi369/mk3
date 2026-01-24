import allTickers from "./all.json";
import { POLYGON_API_KEY } from "@/config/env.js";

// All 12 month codes for futures contracts
const MONTHS = ["F", "G", "H", "J", "K", "M", "N", "Q", "U", "V", "X", "Z"];
const YEAR = "6";

interface TickerResult {
  ticker: string;
  validMonths: string[];
  invalidMonths: string[];
}

async function checkContract(ticker: string, month: string): Promise<boolean> {
  const contract = `${ticker}${month}${YEAR}`;
  const url = `https://api.massive.com/futures/vX/contracts/${contract}?apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Invalid if status is NOT_FOUND
    if (data?.status === "NOT_FOUND") {
      return false;
    }

    return response.ok && data && Object.keys(data).length > 0;
  } catch {
    return false;
  }
}

async function checkTicker(ticker: string): Promise<TickerResult> {
  const validMonths: string[] = [];
  const invalidMonths: string[] = [];

  for (const month of MONTHS) {
    const valid = await checkContract(ticker, month);
    if (valid) {
      validMonths.push(month);
    } else {
      invalidMonths.push(month);
    }
  }

  return { ticker, validMonths, invalidMonths };
}

async function main() {
  const results: { valid: string[]; invalid: string[] } = {
    valid: [],
    invalid: [],
  };

  for (const [assetClass, tickers] of Object.entries(allTickers)) {
    console.log(`\n--- ${assetClass.toUpperCase()} ---`);

    for (const ticker of tickers as string[]) {
      const result = await checkTicker(ticker);

      if (result.validMonths.length > 0) {
        console.log(`✅ ${ticker} (valid: ${result.validMonths.join(", ")})`);
        results.valid.push(ticker);
      } else {
        console.log(`❌ ${ticker} (no valid months)`);
        results.invalid.push(ticker);
      }
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Valid: ${results.valid.length}`);
  console.log(`Invalid: ${results.invalid.length}`);
  if (results.invalid.length > 0) {
    console.log("\nInvalid tickers:", results.invalid.join(", "));
  }
}

main();
