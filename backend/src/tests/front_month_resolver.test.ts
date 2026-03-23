import { describe, expect, test } from "bun:test";
import { resolveFrontMonth } from "@/utils/front_month_resolver.js";
import type { FrontMonthCandidate } from "@/utils/front_month_resolver.js";

describe("resolveFrontMonth", () => {
  test("prefers the most liquid active contract over nearest expiry", () => {
    const candidates: FrontMonthCandidate[] = [
      {
        contract: {
          ticker: "ESM6",
          productCode: "ES",
          lastTradeDate: "2026-06-19",
          active: true,
        },
        snapshot: {
          details: {
            ticker: "ESM6",
            product_code: "ES",
            settlement_date: "2026-06-19",
          },
          session: {
            volume: 1000,
            close: 6100,
          },
          open_interest: 500,
        },
      },
      {
        contract: {
          ticker: "ESH6",
          productCode: "ES",
          lastTradeDate: "2026-03-31",
          active: true,
        },
        snapshot: {
          details: {
            ticker: "ESH6",
            product_code: "ES",
            settlement_date: "2026-03-31",
          },
          session: {
            volume: 100,
            close: 6000,
          },
          open_interest: 250,
        },
      },
    ];

    const resolved = resolveFrontMonth(candidates, "ES", "us_indices");

    expect(resolved).not.toBeNull();
    expect(resolved?.frontMonth).toBe("ESM6");
    expect(resolved?.nearestExpiry).toBe("ESH6");
    expect(resolved?.isRolling).toBe(true);
    expect(resolved?.confidence).toBe("high");
  });

  test("falls back to nearest expiry when liquidity signals are absent", () => {
    const candidates: FrontMonthCandidate[] = [
      {
        contract: {
          ticker: "GCJ6",
          productCode: "GC",
          lastTradeDate: "2026-04-28",
          active: true,
        },
        snapshot: null,
      },
      {
        contract: {
          ticker: "GCM6",
          productCode: "GC",
          lastTradeDate: "2026-06-26",
          active: true,
        },
        snapshot: null,
      },
    ];

    const resolved = resolveFrontMonth(candidates, "GC", "metals");

    expect(resolved).not.toBeNull();
    expect(resolved?.frontMonth).toBe("GCJ6");
    expect(resolved?.nearestExpiry).toBe("GCJ6");
    expect(resolved?.confidence).toBe("low");
    expect(resolved?.candidateCount).toBe(2);
  });
});
