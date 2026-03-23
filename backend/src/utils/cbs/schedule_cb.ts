import type { PolygonWsRequest, PolygonAssetClass } from "@/types/polygon.types.js";
import { SUBSCRIPTION_CONFIG } from "@/config/subscriptions.js";
import activeMonthsData from "../../../tickers/active_months.json" with { type: "json" };
import { contractProvider } from "@/utils/contract_provider.js";
import { getProductRoots } from "@/utils/futures_universe.js";

// Month code to month number mapping
const MONTH_ORDER: Record<string, number> = {
  F: 1, G: 2, H: 3, J: 4, K: 5, M: 6,
  N: 7, Q: 8, U: 9, V: 10, X: 11, Z: 12,
};

// Map asset class to the key in active.json
const ASSET_CLASS_TO_ACTIVE_KEY: Record<PolygonAssetClass, string> = {
  currencies: "INTEREST_RATES",
  grains: "GRAINS",
  metals: "METALS",
  softs: "SOFTS",
  us_indices: "US_INDICES",
  volatiles: "ENERGY_VOLATILES",
};

const LIMITS_MAP: Record<PolygonAssetClass, number> = {
  us_indices: SUBSCRIPTION_CONFIG.US_INDICES_QUARTERS,
  metals: SUBSCRIPTION_CONFIG.METALS_QUARTERS,
  currencies: SUBSCRIPTION_CONFIG.CURRENCY_QUARTERS,
  grains: SUBSCRIPTION_CONFIG.GRAINS_MONTHS,
  softs: SUBSCRIPTION_CONFIG.SOFTS_MONTHS,
  volatiles: SUBSCRIPTION_CONFIG.VOLATILES_MONTHS,
};

// Flatten active months data into a lookup: ticker -> months[]
const ACTIVE_MONTHS: Record<string, string[]> = {};
for (const category of Object.values(activeMonthsData.FUTURES_ACTIVE_MONTHS)) {
  for (const [ticker, months] of Object.entries(category)) {
    ACTIVE_MONTHS[ticker] = months as string[];
  }
}

/**
 * Get the current and next year's suffix (e.g., "5" for 2025, "6" for 2026)
 */
function getYearSuffixes(): [string, string] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentSuffix = String(currentYear % 10);
  const nextSuffix = String((currentYear + 1) % 10);
  return [currentSuffix, nextSuffix];
}

/**
 * Generate contract symbols for a ticker based on active months.
 * Returns symbols sorted by expiration (current year first, then next year).
 */
function generateContractSymbols(ticker: string, limit: number): string[] {
  const months = ACTIVE_MONTHS[ticker];
  if (!months || months.length === 0) {
    return [];
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const [currentYearSuffix, nextYearSuffix] = getYearSuffixes();

  const symbols: { symbol: string; sortKey: number }[] = [];

  // Generate symbols for current year (future months only)
  for (const monthCode of months) {
    const monthNum = MONTH_ORDER[monthCode];
    if (monthNum && monthNum >= currentMonth) {
      symbols.push({
        symbol: `${ticker}${monthCode}${currentYearSuffix}`,
        sortKey: monthNum,
      });
    }
  }

  // Generate symbols for next year
  for (const monthCode of months) {
    const monthNum = MONTH_ORDER[monthCode];
    if (monthNum) {
      symbols.push({
        symbol: `${ticker}${monthCode}${nextYearSuffix}`,
        sortKey: monthNum + 12,
      });
    }
  }

  // Sort by expiration order and apply limit
  symbols.sort((a, b) => a.sortKey - b.sortKey);
  return symbols.slice(0, limit).map((s) => s.symbol);
}

class ScheduleContractBuilder {
  async buildRequestAsync(
    assetClass: PolygonAssetClass,
    eventType: "A" | "AM"
  ): Promise<PolygonWsRequest> {
    const tickerRoots = await getProductRoots(assetClass);
    const symbols: string[] = [];
    const limit = LIMITS_MAP[assetClass] || 1;

    const contractResults = await Promise.allSettled(
      tickerRoots.map(async (root) => {
        const liveContracts = await contractProvider.fetchActiveContracts(root);
        if (liveContracts.length > 0) {
          return liveContracts.slice(0, limit);
        }

        return generateContractSymbols(root, limit);
      }),
    );

    for (let index = 0; index < contractResults.length; index++) {
      const root = tickerRoots[index];
      const result = contractResults[index];
      if (!root || !result) continue;

      if (result.status === "fulfilled") {
        symbols.push(...result.value);
        continue;
      }

      const fallbackContracts = generateContractSymbols(root, limit);
      symbols.push(...fallbackContracts);
    }

    console.log(`[ScheduleBuilder] ${assetClass}: ${symbols.length} symbols`);

    return {
      ev: eventType,
      symbols,
      assetClass,
    };
  }
}

export const scheduleBuilder = new ScheduleContractBuilder();
