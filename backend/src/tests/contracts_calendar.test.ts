import { describe, expect, test } from "bun:test";
import {
  buildGeneratedContracts,
  generateContractSymbols,
  isOutrightTickerForRoot,
} from "@/utils/contracts_calendar.js";

describe("contracts calendar", () => {
  test("generates forward contracts from configured month codes", () => {
    const referenceDate = new Date("2026-03-25T12:00:00Z");

    expect(generateContractSymbols("ES", 4, referenceDate)).toEqual([
      "ESH6",
      "ESM6",
      "ESU6",
      "ESZ6",
    ]);

    expect(generateContractSymbols("CL", 4, referenceDate)).toEqual([
      "CLH6",
      "CLJ6",
      "CLK6",
      "CLM6",
    ]);
  });

  test("builds generated contracts with ordered estimated expiry dates", () => {
    const referenceDate = new Date("2026-03-25T12:00:00Z");
    const contracts = buildGeneratedContracts("RTY", 3, referenceDate);

    expect(contracts.map((contract) => contract.ticker)).toEqual([
      "RTYH6",
      "RTYM6",
      "RTYU6",
    ]);
    expect(contracts.map((contract) => contract.lastTradeDate)).toEqual([
      "2026-03-31",
      "2026-06-30",
      "2026-09-30",
    ]);
  });

  test("identifies outright tickers and rejects spread-like symbols", () => {
    expect(isOutrightTickerForRoot("ES", "ESH6")).toBe(true);
    expect(isOutrightTickerForRoot("RTY", "RTYM6")).toBe(true);
    expect(isOutrightTickerForRoot("ES", "ESZ9-ESZ0")).toBe(false);
    expect(isOutrightTickerForRoot("LBR", "LBRX6-SYPX6")).toBe(false);
    expect(isOutrightTickerForRoot("ES", "ESBAD")).toBe(false);
  });
});
