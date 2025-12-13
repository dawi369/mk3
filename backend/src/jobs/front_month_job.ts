import { CronJob } from "cron";
import { redisStore } from "@/server/data/redis_store.js";
import { POLYGON_API_KEY } from "@/config/env.js";
import activeMonthsData from "@/utils/cbs/active.json" with { type: "json" };
import type {
  FrontMonthInfo,
  FrontMonthCache,
  FrontMonthJobStatus,
  PolygonSnapshotResponse,
  PolygonSnapshotContract,
} from "@/types/front_month.types.js";
import type { PolygonAssetClass } from "@/types/polygon.types.js";

const POLYGON_SNAPSHOT_URL = "https://api.massive.com/futures/vX/snapshot";
const REDIS_CACHE_KEY = "cache:front-months";
const REDIS_STATUS_KEY = "job:front-months:status";

// Map active.json categories to PolygonAssetClass
const CATEGORY_TO_ASSET_CLASS: Record<string, PolygonAssetClass> = {
  INTEREST_RATES: "currencies",
  GRAINS: "grains",
  METALS: "metals",
  SOFTS: "softs",
  US_INDICES: "us_indices",
  ENERGY_VOLATILES: "volatiles",
};

// Extract all product codes from active.json with their asset class
function getProductCodes(): Array<{ code: string; assetClass: PolygonAssetClass }> {
  const products: Array<{ code: string; assetClass: PolygonAssetClass }> = [];

  for (const [category, tickers] of Object.entries(activeMonthsData.FUTURES_ACTIVE_MONTHS)) {
    const assetClass = CATEGORY_TO_ASSET_CLASS[category];
    if (!assetClass) continue;

    for (const code of Object.keys(tickers)) {
      products.push({ code, assetClass });
    }
  }

  return products;
}

async function fetchSnapshot(productCode: string): Promise<PolygonSnapshotContract[]> {
  const url = `${POLYGON_SNAPSHOT_URL}?product_code=${productCode}&apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as PolygonSnapshotResponse;

    if (data.status !== "OK" || !data.results) {
      console.warn(`[FrontMonthJob] No snapshot data for ${productCode}`);
      return [];
    }

    return data.results;
  } catch (error) {
    console.error(`[FrontMonthJob] Error fetching snapshot for ${productCode}:`, error);
    return [];
  }
}

function analyzeContracts(
  contracts: PolygonSnapshotContract[],
  productCode: string,
  assetClass: PolygonAssetClass
): FrontMonthInfo | null {
  const now = new Date();

  // Filter and analyze outright contracts (no spreads)
  const outrights = contracts
    .filter((c) => !c.details.ticker.includes("-"))
    .map((c) => {
      const settlementDate = new Date(c.details.settlement_date / 1_000_000);
      const daysToExpiry = Math.ceil(
        (settlementDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ticker: c.details.ticker,
        volume: c.session?.volume || 0,
        daysToExpiry,
        lastPrice: c.last_trade?.price || c.session?.close || null,
        expiryDate: settlementDate.toISOString().split("T")[0],
      };
    })
    .filter((c) => c.daysToExpiry > 0); // Only future contracts

  if (outrights.length === 0) {
    return null;
  }

  // Find nearest expiry
  const nearest = [...outrights].sort((a, b) => a.daysToExpiry - b.daysToExpiry)[0];

  // Find highest volume
  const highestVolume = [...outrights].sort((a, b) => b.volume - a.volume)[0];

  if (!nearest || !highestVolume) {
    return null;
  }

  return {
    frontMonth: highestVolume.ticker,
    productCode,
    assetClass,
    volume: highestVolume.volume,
    daysToExpiry: highestVolume.daysToExpiry,
    nearestExpiry: nearest.ticker,
    isRolling: highestVolume.ticker !== nearest.ticker,
    lastPrice: highestVolume.lastPrice,
    expiryDate: highestVolume.expiryDate || "",
  };
}

class FrontMonthJob {
  private status: FrontMonthJobStatus = {
    lastRunTime: null,
    lastSuccess: false,
    lastError: null,
    productsUpdated: 0,
    totalRuns: 0,
  };

  private cache: FrontMonthCache | null = null;

  async loadStatus(): Promise<void> {
    try {
      const [savedStatus, savedCache] = await Promise.all([
        redisStore.redis.get(REDIS_STATUS_KEY),
        redisStore.redis.get(REDIS_CACHE_KEY),
      ]);

      if (savedStatus) {
        this.status = JSON.parse(savedStatus);
        console.log(
          `[FrontMonthJob] Loaded status: ${this.status.totalRuns} runs, last: ${
            this.status.lastRunTime ? new Date(this.status.lastRunTime).toISOString() : "never"
          }`
        );
      }

      if (savedCache) {
        this.cache = JSON.parse(savedCache);
        console.log(
          `[FrontMonthJob] Loaded cache with ${Object.keys(this.cache?.products || {}).length} products`
        );
      }
    } catch (err) {
      console.error("[FrontMonthJob] Failed to load status:", err);
    }
  }

  private async saveStatus(): Promise<void> {
    try {
      await redisStore.redis.set(REDIS_STATUS_KEY, JSON.stringify(this.status));
    } catch (err) {
      console.error("[FrontMonthJob] Failed to save status:", err);
    }
  }

  private async saveCache(): Promise<void> {
    try {
      if (this.cache) {
        await redisStore.redis.set(REDIS_CACHE_KEY, JSON.stringify(this.cache));
      }
    } catch (err) {
      console.error("[FrontMonthJob] Failed to save cache:", err);
    }
  }

  async runRefresh(): Promise<void> {
    console.log("--- FrontMonthJob ---");
    console.log("[FrontMonthJob] Running front month detection...");

    this.status.totalRuns++;
    this.status.lastRunTime = Date.now();

    try {
      const products = getProductCodes();
      const newCache: FrontMonthCache = {
        lastUpdated: Date.now(),
        products: {},
      };

      for (const { code, assetClass } of products) {
        const contracts = await fetchSnapshot(code);
        const frontMonth = analyzeContracts(contracts, code, assetClass);

        if (frontMonth) {
          newCache.products[code] = frontMonth;
          const rollIndicator = frontMonth.isRolling ? " (ROLLING)" : "";
          console.log(
            `[FrontMonthJob] ${code}: ${frontMonth.frontMonth} (${frontMonth.volume.toLocaleString()} vol)${rollIndicator}`
          );
        } else {
          console.warn(`[FrontMonthJob] ${code}: No front month detected`);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.cache = newCache;
      this.status.lastSuccess = true;
      this.status.lastError = null;
      this.status.productsUpdated = Object.keys(newCache.products).length;

      await Promise.all([this.saveStatus(), this.saveCache()]);

      console.log(
        `[FrontMonthJob] Completed: ${this.status.productsUpdated} products updated`
      );
      console.log("");
    } catch (err) {
      this.status.lastSuccess = false;
      this.status.lastError = err instanceof Error ? err.message : String(err);
      await this.saveStatus();
      console.error("[FrontMonthJob] Failed:", err);
    }
  }

  getStatus(): FrontMonthJobStatus {
    return { ...this.status };
  }

  getCache(): FrontMonthCache | null {
    return this.cache;
  }

  schedule(): void {
    // Run at 3 AM ET daily (after the 2 AM clear job)
    new CronJob(
      "0 3 * * *",
      async () => {
        await this.runRefresh();
      },
      null,
      true,
      "America/New_York"
    );

    console.log("[FrontMonthJob] Scheduled (3 AM ET daily)");
  }
}

export const frontMonthJob = new FrontMonthJob();
