import { describe, expect, spyOn, test } from "bun:test";
import { scheduleBuilder } from "@/utils/cbs/schedule_cb.js";
import { contractProvider } from "@/utils/contract_provider.js";
import type { MassiveAssetClass } from "@/types/massive.types.js";
import * as futuresUniverse from "@/utils/futures_universe.js";

describe("ScheduleContractBuilder", () => {
  test("prefers live contracts and falls back per root when provider fails", async () => {
    spyOn(futuresUniverse, "getProductRoots").mockResolvedValue([
      "ES",
      "NQ",
    ] as unknown as MassiveAssetClass[] as any);
    spyOn(contractProvider, "fetchActiveContracts").mockImplementation(
      async (root: string) => {
        if (root === "ES") return ["ESH6", "ESM6"];
        throw new Error("provider failed");
      },
    );

    const request = await scheduleBuilder.buildRequestAsync("us_indices", "A");

    expect(request.ev).toBe("A");
    expect(request.assetClass).toBe("us_indices");
    expect(request.symbols).toHaveLength(2);
    expect(request.symbols[0]).toBe("ESH6");
    expect(request.symbols[1]?.startsWith("NQ")).toBe(true);
  });

  test("uses generated fallback symbols when live contracts are empty", async () => {
    spyOn(futuresUniverse, "getProductRoots").mockResolvedValue(["CL"] as any);
    spyOn(contractProvider, "fetchActiveContracts").mockResolvedValue([]);

    const request = await scheduleBuilder.buildRequestAsync("volatiles", "A");

    expect(request.symbols).toHaveLength(1);
    expect(request.symbols[0]?.startsWith("CL")).toBe(true);
  });
});
