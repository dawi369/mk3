import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
import { scheduleBuilder } from "@/utils/cbs/schedule_cb.js";
import { redisStore } from "@/server/data/redis_store.js";
import type { PolygonAssetClass, PolygonWsRequest } from "@/types/polygon.types.js";

const ALL_ASSET_CLASSES: PolygonAssetClass[] = [
  "us_indices",
  "metals",
  "currencies",
  "grains",
  "softs",
  "volatiles",
];

describe("MonthlySubscriptionJob", () => {
  afterEach(() => {
    mock.restore();
  });

  test("updates an existing asset-class subscription when symbols change", async () => {
    const existing: PolygonWsRequest = {
      ev: "A",
      assetClass: "us_indices",
      symbols: ["ESH6"],
    };

    const next: PolygonWsRequest = {
      ev: "A",
      assetClass: "us_indices",
      symbols: ["ESM6"],
    };

    const updateSubscription = mock(async () => {});
    const subscribe = mock(async () => {});
    const unchangedSubscriptions = ALL_ASSET_CLASSES.filter(
      (assetClass) => assetClass !== "us_indices",
    ).map((assetClass) => ({
      ev: "A" as const,
      assetClass,
      symbols: [],
    }));
    const fakeClient = {
      getSubscriptions: () => [existing, ...unchangedSubscriptions],
      updateSubscription,
      subscribe,
    };

    monthlySubscriptionJob.attachClient(fakeClient as any);

    spyOn(scheduleBuilder, "buildRequestAsync").mockImplementation(
      async (assetClass) =>
        assetClass === "us_indices"
          ? next
          : {
              ev: "A",
              assetClass,
              symbols: [],
            },
    );

    const setSubscribedSymbols = spyOn(
      redisStore,
      "setSubscribedSymbols",
    ).mockResolvedValue();
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await monthlySubscriptionJob.runRefresh();

    expect(updateSubscription).toHaveBeenCalledTimes(1);
    expect(updateSubscription).toHaveBeenCalledWith(existing, next);
    expect(subscribe).not.toHaveBeenCalled();
    expect(setSubscribedSymbols).toHaveBeenCalled();
    expect(monthlySubscriptionJob.getStatus().lastSuccess).toBe(true);
  });

  test("subscribes when no current subscription exists for the asset class", async () => {
    const next: PolygonWsRequest = {
      ev: "A",
      assetClass: "metals",
      symbols: ["GCM6", "GCQ6"],
    };

    const updateSubscription = mock(async () => {});
    const subscribe = mock(async () => {});
    const existingSubscriptions = ALL_ASSET_CLASSES.filter(
      (assetClass) => assetClass !== "metals",
    ).map((assetClass) => ({
      ev: "A" as const,
      assetClass,
      symbols: [],
    }));
    const fakeClient = {
      getSubscriptions: () => existingSubscriptions,
      updateSubscription,
      subscribe,
    };

    monthlySubscriptionJob.attachClient(fakeClient as any);

    spyOn(scheduleBuilder, "buildRequestAsync").mockImplementation(
      async (assetClass) =>
        assetClass === "metals"
          ? next
          : {
              ev: "A",
              assetClass,
              symbols: [],
            },
    );

    spyOn(redisStore, "setSubscribedSymbols").mockResolvedValue();
    spyOn(redisStore.redis, "set").mockResolvedValue("OK" as any);

    await monthlySubscriptionJob.runRefresh();

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith(next);
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(monthlySubscriptionJob.getStatus().lastSuccess).toBe(true);
  });
});
