import { describe, expect, spyOn, test } from "bun:test";
import { FrontMonthJob } from "@/jobs/front_month_job.js";
import { contractProvider } from "@/utils/contract_provider.js";
import { redisStore } from "@/server/data/redis_store.js";
import * as futuresUniverse from "@/utils/futures_universe.js";
import * as massiveSnapshots from "@/utils/massive_snapshots.js";
import * as resolver from "@/utils/front_month_resolver.js";
import { buildGeneratedContracts } from "@/utils/contracts_calendar.js";

describe("FrontMonthJob unit", () => {
  test("builds and stores a refreshed front month cache", async () => {
    const job = new FrontMonthJob();

    spyOn(futuresUniverse, "getAllConfiguredProducts").mockResolvedValue([
      { code: "ES", assetClass: "us_indices" },
      { code: "GC", assetClass: "metals" },
    ]);
    spyOn(contractProvider, "fetchActiveContractsDetailed").mockImplementation(
      async (code: string) => [
        {
          ticker: `${code}H9`,
          productCode: code,
          lastTradeDate: "2099-03-15",
          active: true,
        },
      ],
    );
    const writeContractsSpy = spyOn(
      redisStore,
      "writeActiveContracts",
    ).mockResolvedValue();
    spyOn(massiveSnapshots, "fetchTickerSnapshotContract").mockResolvedValue({
      details: {
        ticker: "ESH9",
        product_code: "ES",
        settlement_date: "2099-03-15",
      },
      session: {
        volume: 1000,
        close: 5000,
      },
    } as any);
    spyOn(resolver, "resolveFrontMonth").mockImplementation(
      (_snapshots, code, assetClass) => ({
        frontMonth: `${code}H9`,
        productCode: code,
        assetClass,
        volume: 1000,
        daysToExpiry: 20,
        nearestExpiry: `${code}H9`,
        isRolling: false,
        lastPrice: 5000,
        expiryDate: "2099-03-15",
        confidence: "high",
        candidateCount: 1,
      }),
    );
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await job.runRefresh();

    expect(writeContractsSpy).toHaveBeenCalledTimes(2);
    expect(job.getStatus().lastSuccess).toBe(true);
    expect(job.getStatus().productsUpdated).toBe(2);
    expect(job.getCache()?.products.ES?.frontMonth).toBe("ESH9");
    expect(job.getCache()?.products.GC?.frontMonth).toBe("GCH9");
  });

  test("records failure state when refresh throws", async () => {
    const job = new FrontMonthJob();
    spyOn(futuresUniverse, "getAllConfiguredProducts").mockRejectedValue(
      new Error("universe failed"),
    );
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await job.runRefresh();

    expect(job.getStatus().lastSuccess).toBe(false);
    expect(job.getStatus().lastError).toContain("universe failed");
  });

  test("falls back to generated outright candidates when provider contracts are unusable", async () => {
    const job = new FrontMonthJob();
    const generated = buildGeneratedContracts("ES", 4);
    const expectedTicker = generated[1]?.ticker || generated[0]?.ticker;

    expect(expectedTicker).toBeTruthy();

    spyOn(futuresUniverse, "getAllConfiguredProducts").mockResolvedValue([
      { code: "ES", assetClass: "us_indices" },
    ]);
    spyOn(contractProvider, "fetchActiveContractsDetailed").mockResolvedValue([]);
    spyOn(redisStore, "writeActiveContracts").mockResolvedValue();
    spyOn(massiveSnapshots, "fetchTickerSnapshotContract").mockImplementation(
      async (ticker: string) => {
        if (ticker !== expectedTicker) {
          return null;
        }

        return {
          details: {
            ticker,
            product_code: "ES",
            settlement_date: "2099-06-15",
          },
          session: {
            volume: 1000,
            close: 5000,
          },
        } as any;
      },
    );
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await job.runRefresh();

    expect(job.getStatus().lastSuccess).toBe(true);
    expect(job.getStatus().productsUpdated).toBe(1);
    expect(job.getCache()?.products.ES?.frontMonth).toBe(expectedTicker);
  });
});
