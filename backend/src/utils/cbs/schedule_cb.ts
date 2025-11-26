import type {
  PolygonWsRequest,
  PolygonAssetClass,
} from "@/types/polygon.types.js";
import { Tickers } from "@/utils/tickers.js";
import { SUBSCRIPTION_CONFIG } from "@/config/subscriptions.js";
import { contractProvider } from "@/utils/contract_provider.js";

const LIMITS_MAP: Record<PolygonAssetClass, number> = {
  us_indices: SUBSCRIPTION_CONFIG.US_INDICES_QUARTERS,
  metals: SUBSCRIPTION_CONFIG.METALS_QUARTERS,
  currencies: SUBSCRIPTION_CONFIG.CURRENCY_QUARTERS,
  grains: SUBSCRIPTION_CONFIG.GRAINS_MONTHS,
  softs: SUBSCRIPTION_CONFIG.SOFTS_MONTHS,
  volatiles: SUBSCRIPTION_CONFIG.VOLATILES_MONTHS,
};

class ScheduleContractBuilder {
  private tickers: Tickers;

  constructor() {
    this.tickers = new Tickers();
  }

  async buildRequestAsync(
    assetClass: PolygonAssetClass,
    eventType: "A" | "AM"
  ): Promise<PolygonWsRequest> {
    const tickerRoots = this.tickers.listCodes(assetClass as any);
    const symbols: string[] = [];

    console.log(`Building async request for ${assetClass}...`);

    // Determine limit based on asset class
    const limit = LIMITS_MAP[assetClass] || 1;
    console.log(`Limit for ${assetClass}: ${limit}`);

    for (const root of tickerRoots) {
      // We fetch all active contracts for this root
      const contracts = await contractProvider.fetchActiveContracts(root);

      if (contracts.length === 0) {
        console.warn(`No active contracts found for ${root}`);
        continue;
      }

      // Apply limit
      const limited = contracts.slice(0, limit);
      symbols.push(...limited);
    }

    console.log(`Built ${symbols.length} symbols for ${assetClass}`);

    return {
      ev: eventType,
      symbols,
      assetClass,
    };
  }
}

export const scheduleBuilder = new ScheduleContractBuilder();
