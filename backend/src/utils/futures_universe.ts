import type { MassiveAssetClass } from "@/types/massive.types.js";
import { Tickers } from "@/utils/tickers.js";
import activeMonthsData from "../../tickers/active_months.json" with { type: "json" };

const CATEGORY_TO_ASSET_CLASS: Record<string, MassiveAssetClass> = {
  INTEREST_RATES: "currencies",
  GRAINS: "grains",
  METALS: "metals",
  SOFTS: "softs",
  US_INDICES: "us_indices",
  ENERGY_VOLATILES: "volatiles",
};

let tickersPromise: Promise<Tickers> | null = null;

export function resetFuturesUniverseCacheForTesting(): void {
  tickersPromise = null;
}

async function getTickers(): Promise<Tickers> {
  if (!tickersPromise) {
    tickersPromise = Tickers.create();
  }
  return tickersPromise;
}

function getActiveMonthRoots(): Record<MassiveAssetClass, Set<string>> {
  const roots: Record<MassiveAssetClass, Set<string>> = {
    currencies: new Set<string>(),
    grains: new Set<string>(),
    metals: new Set<string>(),
    softs: new Set<string>(),
    us_indices: new Set<string>(),
    volatiles: new Set<string>(),
  };

  for (const [category, entries] of Object.entries(
    activeMonthsData.FUTURES_ACTIVE_MONTHS,
  )) {
    const assetClass = CATEGORY_TO_ASSET_CLASS[category];
    if (!assetClass) continue;

    for (const root of Object.keys(entries)) {
      roots[assetClass].add(root);
    }
  }

  return roots;
}

export async function getProductRoots(
  assetClass: MassiveAssetClass,
): Promise<string[]> {
  const activeMonthRoots = getActiveMonthRoots();
  const tickers = await getTickers();
  const combined = new Set<string>([
    ...activeMonthRoots[assetClass],
    ...tickers.listCodes(assetClass as any),
  ]);

  return Array.from(combined).sort();
}

export async function getAllConfiguredProducts(): Promise<
  Array<{ code: string; assetClass: MassiveAssetClass }>
> {
  const assetClasses: MassiveAssetClass[] = [
    "us_indices",
    "metals",
    "currencies",
    "grains",
    "softs",
    "volatiles",
  ];

  const products: Array<{ code: string; assetClass: MassiveAssetClass }> = [];

  for (const assetClass of assetClasses) {
    const roots = await getProductRoots(assetClass);
    for (const code of roots) {
      products.push({ code, assetClass });
    }
  }

  return products;
}
