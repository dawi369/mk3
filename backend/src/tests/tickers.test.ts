import { describe, expect, test } from "bun:test";
import { Tickers } from "@/utils/tickers.js";

describe("Tickers", () => {
  test("loads local ticker metadata and exposes code lookups", async () => {
    const tickers = await Tickers.create();

    expect(tickers.listCodes("us_indices").sort()).toEqual([
      "ES",
      "NQ",
      "RTY",
      "YM",
    ]);
    expect(tickers.hasCode("metals", "GC")).toBe(true);
    expect(tickers.getCode("metals", "GC")?.product_code).toBe("GC");
    expect(tickers.getCode("metals", "GC")?.trading_venue).toBeDefined();
  });

  test("filters by sector and venue using loaded metadata", async () => {
    const tickers = await Tickers.create();

    const precious = tickers.getBySector("precious");
    expect(precious.some((ticker) => ticker.product_code === "GC")).toBe(true);

    const xcme = tickers.getByVenue("XCME");
    expect(xcme.some((ticker) => ticker.product_code === "ES")).toBe(true);
  });
});
