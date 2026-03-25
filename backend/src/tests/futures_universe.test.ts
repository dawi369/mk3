import { describe, expect, test } from "bun:test";
import {
  getAllConfiguredProducts,
  getProductRoots,
  resetFuturesUniverseCacheForTesting,
} from "@/utils/futures_universe.js";

describe("futures universe", () => {
  test("combines active-month roots with local ticker metadata", async () => {
    resetFuturesUniverseCacheForTesting();
    const roots = await getProductRoots("us_indices");

    expect(roots).toEqual(["ES", "NQ", "RTY", "YM"]);
  });

  test("returns configured products across all supported asset classes", async () => {
    resetFuturesUniverseCacheForTesting();
    const products = await getAllConfiguredProducts();
    const keys = new Set(products.map((product) => `${product.assetClass}:${product.code}`));

    expect(keys.has("us_indices:ES")).toBe(true);
    expect(keys.has("metals:GC")).toBe(true);
    expect(keys.has("currencies:6E")).toBe(true);
    expect(keys.has("grains:ZC")).toBe(true);
    expect(keys.has("softs:KT")).toBe(true);
    expect(keys.has("volatiles:CL")).toBe(true);
  });
});
