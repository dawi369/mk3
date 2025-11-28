import type { PolygonWsRequest, PolygonAssetClass } from "@/types/polygon.types.js";
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
  private tickers: Tickers | null = null;

  private async getTickers(): Promise<Tickers> {
    if (!this.tickers) {
      this.tickers = await Tickers.create();
    }
    return this.tickers;
  }

  async buildRequestAsync(assetClass: PolygonAssetClass, eventType: "A" | "AM"): Promise<PolygonWsRequest> {
    const tickers = await this.getTickers();
    const tickerRoots = tickers.listCodes(assetClass as any);
    const symbols: string[] = [];

    console.log(`[ScheduleBuilder] Building async request for ${assetClass}...`);
    console.log(`[ScheduleBuilder] Ticker roots for ${assetClass}:`, tickerRoots);

    // Determine limit based on asset class
    const limit = LIMITS_MAP[assetClass] || 1;
    console.log(`[ScheduleBuilder] Limit for ${assetClass}: ${limit}`);

    for (let i = 0; i < tickerRoots.length; i++) {
      const root = tickerRoots[i];
      if (!root) continue;

      console.log(`[ScheduleBuilder] Processing ticker ${i + 1}/${tickerRoots.length}: ${root}`);

      // We fetch all active contracts for this root
      console.log(`[ScheduleBuilder] Fetching contracts for ${root}...`);
      const contracts = await contractProvider.fetchActiveContracts(root);
      console.log(`[ScheduleBuilder] Fetched ${contracts.length} contracts for ${root}`);

      if (contracts.length === 0) {
        console.warn(`[ScheduleBuilder] No active contracts found for ${root}`);
        continue;
      }

      // Apply limit
      const limited = contracts.slice(0, limit);
      console.log(`[ScheduleBuilder] Applied limit, using ${limited.length} contracts for ${root}:`, limited);
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
