import { describe, expect, test } from "bun:test";
import { resolveFrontMonth } from "@/utils/front_month_resolver.js";
import type { FrontMonthCandidate } from "@/utils/front_month_resolver.js";

describe("resolveFrontMonth", () => {
  test("prefers the most liquid active contract over nearest expiry", () => {
    const candidates: FrontMonthCandidate[] = [
      {
        contract: {
          ticker: "ESM9",
          productCode: "ES",
          lastTradeDate: "2099-06-19",
          active: true,
        },
        snapshot: {
          details: {
            ticker: "ESM9",
            product_code: "ES",
            settlement_date: "2099-06-19",
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
          ticker: "ESH9",
          productCode: "ES",
          lastTradeDate: "2099-03-31",
          active: true,
        },
        snapshot: {
          details: {
            ticker: "ESH9",
            product_code: "ES",
            settlement_date: "2099-03-31",
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
    expect(resolved?.frontMonth).toBe("ESM9");
    expect(resolved?.nearestExpiry).toBe("ESH9");
    expect(resolved?.isRolling).toBe(true);
    expect(resolved?.confidence).toBe("high");
  });

  test("falls back to nearest expiry when liquidity signals are absent", () => {
    const candidates: FrontMonthCandidate[] = [
      {
        contract: {
          ticker: "GCJ9",
          productCode: "GC",
          lastTradeDate: "2099-04-28",
          active: true,
        },
        snapshot: null,
      },
      {
        contract: {
          ticker: "GCM9",
          productCode: "GC",
          lastTradeDate: "2099-06-26",
          active: true,
        },
        snapshot: null,
      },
    ];

    const resolved = resolveFrontMonth(candidates, "GC", "metals");

    expect(resolved).not.toBeNull();
    expect(resolved?.frontMonth).toBe("GCJ9");
    expect(resolved?.nearestExpiry).toBe("GCJ9");
    expect(resolved?.confidence).toBe("low");
    expect(resolved?.candidateCount).toBe(2);
  });

  test("ignores snapshotless near contracts when later candidates have live snapshots", () => {
    const candidates: FrontMonthCandidate[] = [
      {
        contract: {
          ticker: "RTYH9",
          productCode: "RTY",
          lastTradeDate: "2099-03-31",
          active: true,
        },
        snapshot: null,
      },
      {
        contract: {
          ticker: "RTYM9",
          productCode: "RTY",
          lastTradeDate: "2099-06-18",
          active: true,
        },
        snapshot: {
          details: {
            ticker: "RTYM9",
            product_code: "RTY",
            settlement_date: "2099-06-18",
          },
          session: {
            volume: 150000,
            close: 2200,
          },
        },
      },
    ];

    const resolved = resolveFrontMonth(candidates, "RTY", "us_indices");

    expect(resolved).not.toBeNull();
    expect(resolved?.frontMonth).toBe("RTYM9");
    expect(resolved?.nearestExpiry).toBe("RTYM9");
    expect(resolved?.confidence).toBe("high");
  });
});
