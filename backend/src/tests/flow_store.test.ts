import { describe, expect, test } from "bun:test";
import { flowStore } from "@/server/data/flow_store.js";

describe("FlowStore", () => {
  test("stores latest bars and rolling history", () => {
    for (let index = 0; index < 105; index++) {
      flowStore.setBar("ESH9", {
        symbol: "ESH9",
        open: index,
        high: index + 1,
        low: index - 1,
        close: index,
        volume: 10,
        trades: 1,
        startTime: index,
        endTime: index + 1,
      });
    }

    expect(flowStore.getLatest("ESH9")?.close).toBe(104);
    expect(flowStore.getHistory("ESH9")).toHaveLength(100);
    expect(flowStore.getHistory("ESH9", 3).map((bar) => bar.close)).toEqual([
      102, 103, 104,
    ]);
    expect(flowStore.getAllLatest().some((bar) => bar.symbol === "ESH9")).toBe(
      true,
    );
    expect(flowStore.getSymbols()).toContain("ESH9");
  });
});
