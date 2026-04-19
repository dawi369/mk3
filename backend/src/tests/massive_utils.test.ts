import { describe, expect, test } from "bun:test";
import {
  aggregateToBar,
  buildSubscribeParams,
  isAggregateEvent,
  isMarketHours,
  isQuoteEvent,
  isStatusMessage,
  isTradeEvent,
  toDate,
} from "@/utils/massive.utils.js";

describe("massive utils", () => {
  test("detects websocket message types", () => {
    expect(isStatusMessage({ ev: "status" })).toBe(true);
    expect(isAggregateEvent({ ev: "A" })).toBe(true);
    expect(isQuoteEvent({ ev: "Q" })).toBe(true);
    expect(isTradeEvent({ ev: "T" })).toBe(true);
    expect(isAggregateEvent({ ev: "status" })).toBe(false);
  });

  test("transforms aggregate events into normalized bars", () => {
    expect(
      aggregateToBar({
        ev: "A",
        sym: "ESH9",
        v: 100,
        dv: 1050,
        n: 12,
        o: 10,
        c: 10.5,
        h: 11,
        l: 9.5,
        s: 1000,
        e: 2000,
      }),
    ).toEqual({
      symbol: "ESH9",
      open: 10,
      high: 11,
      low: 9.5,
      close: 10.5,
      volume: 100,
      trades: 12,
      dollarVolume: 1050,
      startTime: 1000,
      endTime: 2000,
    });
  });

  test("builds subscribe params and converts timestamps", () => {
    expect(
      buildSubscribeParams({ ev: "A", symbols: ["ESH9", "NQH9"] }),
    ).toBe("A.ESH9,A.NQH9");
    expect(toDate(1000).getTime()).toBe(1000);
  });

  test("returns a market hours shape", () => {
    const result = isMarketHours();

    expect(typeof result.isOpen).toBe("boolean");
    if (!result.isOpen) {
      expect(typeof result.reason).toBe("string");
    }
  });
});
