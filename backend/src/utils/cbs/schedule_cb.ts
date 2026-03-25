import type { MassiveWsRequest, MassiveAssetClass } from "@/types/massive.types.js";
import { SUBSCRIPTION_CONFIG } from "@/config/subscriptions.js";
import { contractProvider } from "@/utils/contract_provider.js";
import { getProductRoots } from "@/utils/futures_universe.js";
import { generateContractSymbols } from "@/utils/contracts_calendar.js";

// Map asset class to the key in active.json
const ASSET_CLASS_TO_ACTIVE_KEY: Record<MassiveAssetClass, string> = {
  currencies: "INTEREST_RATES",
  grains: "GRAINS",
  metals: "METALS",
  softs: "SOFTS",
  us_indices: "US_INDICES",
  volatiles: "ENERGY_VOLATILES",
};

const LIMITS_MAP: Record<MassiveAssetClass, number> = {
  us_indices: SUBSCRIPTION_CONFIG.US_INDICES_QUARTERS,
  metals: SUBSCRIPTION_CONFIG.METALS_QUARTERS,
  currencies: SUBSCRIPTION_CONFIG.CURRENCY_QUARTERS,
  grains: SUBSCRIPTION_CONFIG.GRAINS_MONTHS,
  softs: SUBSCRIPTION_CONFIG.SOFTS_MONTHS,
  volatiles: SUBSCRIPTION_CONFIG.VOLATILES_MONTHS,
};

class ScheduleContractBuilder {
  async buildRequestAsync(
    assetClass: MassiveAssetClass,
    eventType: "A" | "AM"
  ): Promise<MassiveWsRequest> {
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
