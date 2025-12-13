/**
 * Test script to detect contract volumes using Polygon API snapshot endpoint.
 * Helps identify which contracts are actually active vs technically tradable but dead.
 *
 * Usage: bun run src/tests/test_contract_volume.ts
 */

const API_KEY = "OFppwBA23w4CTOjMNUm02eeNLziPtIMc";
const BASE_URL = "https://api.massive.com";

// Test product codes for different asset classes
const TEST_PRODUCT_CODES = {
  us_indices: ["ES", "NQ", "YM", "RTY"],
  grains: ["ZC", "ZS", "ZW", "KE"],
  softs: ["KT", "CJ", "TT", "YO"],
  metals: ["GC", "SI", "HG", "PL"],
  volatiles: ["CL", "BZ", "LE", "HE"],
};

interface SnapshotContract {
  details: {
    ticker: string;
    product_code: string;
    settlement_date: number;
  };
  session?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    settlement_price?: number;
    previous_settlement?: number;
    change?: number;
    change_percent?: number;
  };
  last_trade?: {
    price: number;
    size: number;
    last_updated: number;
  };
}

interface ContractAnalysis {
  ticker: string;
  volume: number;
  settlementDate: Date;
  daysToExpiry: number;
  lastPrice: number | null;
  isSpread: boolean;
}

async function fetchSnapshot(productCode: string): Promise<SnapshotContract[]> {
  const url = `${BASE_URL}/futures/vX/snapshot?product_code=${productCode}&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results) {
      console.error(`Failed to fetch snapshot for ${productCode}`);
      return [];
    }

    return data.results;
  } catch (error) {
    console.error(`Error fetching snapshot for ${productCode}:`, error);
    return [];
  }
}

function analyzeContracts(contracts: SnapshotContract[]): ContractAnalysis[] {
  const now = new Date();
  const analyses: ContractAnalysis[] = [];

  for (const contract of contracts) {
    // Skip spreads (contain "-")
    const isSpread = contract.details.ticker.includes("-");

    // Convert nanosecond timestamp to Date
    const settlementDate = new Date(contract.details.settlement_date / 1_000_000);
    const daysToExpiry = Math.ceil(
      (settlementDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Skip expired contracts
    if (daysToExpiry < 0) continue;

    analyses.push({
      ticker: contract.details.ticker,
      volume: contract.session?.volume || 0,
      settlementDate,
      daysToExpiry,
      lastPrice: contract.last_trade?.price || contract.session?.close || null,
      isSpread,
    });
  }

  return analyses;
}

function printContractTable(productCode: string, analyses: ContractAnalysis[]): void {
  // Filter out spreads and sort by days to expiry
  const singles = analyses
    .filter((a) => !a.isSpread)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  if (singles.length === 0) {
    console.log(`  No active contracts found for ${productCode}`);
    return;
  }

  console.log(
    `${"Ticker".padEnd(10)} | ${"Days".padEnd(6)} | ${"Volume".padEnd(14)} | ${"Price".padEnd(
      12
    )} | Expiry`
  );
  console.log("─".repeat(70));

  // Show top 6 contracts by expiry
  for (const contract of singles.slice(0, 6)) {
    const volumeIndicator =
      contract.volume > 100000
        ? "🟢"
        : contract.volume > 10000
        ? "🟡"
        : contract.volume > 0
        ? "🟠"
        : "🔴";

    const volumeStr = contract.volume.toLocaleString().padEnd(14);
    const daysStr = contract.daysToExpiry.toString().padEnd(6);
    const priceStr = contract.lastPrice?.toFixed(2).padEnd(12) || "N/A".padEnd(12);
    const expiryStr = contract.settlementDate.toISOString().split("T")[0];

    console.log(
      `${volumeIndicator} ${contract.ticker.padEnd(
        8
      )} | ${daysStr} | ${volumeStr} | ${priceStr} | ${expiryStr}`
    );
  }
}

function identifyFrontMonth(analyses: ContractAnalysis[]): ContractAnalysis | null {
  // Filter out spreads
  const singles = analyses.filter((a) => !a.isSpread && a.daysToExpiry > 0);

  if (singles.length === 0) return null;

  // The "true" front month is the one with highest volume among nearby contracts
  // Sort by volume descending
  const byVolume = [...singles].sort((a, b) => b.volume - a.volume);

  // Get the highest volume contract
  const highestVolume = byVolume[0];

  // Get the nearest expiry contract
  const nearestExpiry = [...singles].sort((a, b) => a.daysToExpiry - b.daysToExpiry)[0];

  // If they differ, it means the market has rolled
  if (highestVolume && nearestExpiry && highestVolume.ticker !== nearestExpiry.ticker) {
    console.log(
      `  ⚠️  ROLL DETECTED: Nearest expiry is ${
        nearestExpiry.ticker
      } (${nearestExpiry.volume.toLocaleString()} vol) but highest volume is ${
        highestVolume.ticker
      } (${highestVolume.volume.toLocaleString()} vol)`
    );
  }

  return highestVolume || null;
}

async function analyzeProductCode(productCode: string): Promise<void> {
  console.log(`\n📊 ${productCode}`);
  console.log("─".repeat(70));

  const contracts = await fetchSnapshot(productCode);
  const analyses = analyzeContracts(contracts);

  printContractTable(productCode, analyses);

  const frontMonth = identifyFrontMonth(analyses);
  if (frontMonth) {
    console.log(
      `\n  ➤ Recommended front month: ${
        frontMonth.ticker
      } (${frontMonth.volume.toLocaleString()} volume, ${frontMonth.daysToExpiry} days to expiry)`
    );
  }
}

async function main() {
  console.log("═".repeat(70));
  console.log("CONTRACT VOLUME ANALYSIS - SNAPSHOT ENDPOINT");
  console.log("Identifying actual front months based on volume, not just expiry");
  console.log("═".repeat(70));

  for (const [assetClass, productCodes] of Object.entries(TEST_PRODUCT_CODES)) {
    console.log(`\n\n${"═".repeat(70)}`);
    console.log(`📈 ${assetClass.toUpperCase()}`);
    console.log("═".repeat(70));

    for (const productCode of productCodes) {
      await analyzeProductCode(productCode);
    }
  }

  console.log(`\n\n${"═".repeat(70)}`);
  console.log("LEGEND:");
  console.log("  🟢 High volume (>100,000) - Active front month");
  console.log("  🟡 Medium volume (10,000-100,000) - Secondary/rolling");
  console.log("  🟠 Low volume (>0) - Minimal activity");
  console.log("  🔴 No volume - Dead/not trading");
  console.log("═".repeat(70));
}

main();
