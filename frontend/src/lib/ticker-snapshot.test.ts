import { describe, expect, test } from "vitest";
import { buildTickerSnapshot, getChangeMetrics, resolveLastPrice, resolveReferencePrice } from "@/lib/ticker-snapshot";
import { makeBar, makeSession, makeSnapshot } from "@/tests/factories";

describe("ticker snapshot", () => {
  test("prefers live and snapshot-backed values when data exists", () => {
    const snapshot = buildTickerSnapshot(
      "ESH6",
      [makeBar({ symbol: "ESH6", open: 100, high: 103, low: 99, close: 102 })],
      makeBar({ symbol: "ESH6", open: 100, high: 104, low: 99, close: 103 }),
      makeSnapshot({ sessionOpen: 99.5, prevSettlement: 98 }),
      makeSession({ dayHigh: 105, dayLow: 97, vwap: 101.25, cvol: 1234 }),
    );

    expect(snapshot.hasData).toBe(true);
    expect(snapshot.last_price).toBe(103);
    expect(snapshot.session_high).toBe(105);
    expect(snapshot.session_low).toBe(97);
    expect(snapshot.prev_close).toBe(98);
    expect(snapshot.cum_volume).toBe(1234);
    expect(snapshot.vwap).toBe(101.25);
  });

  test("does not fabricate a mock snapshot when no data exists", () => {
    const snapshot = buildTickerSnapshot("ESH6");

    expect(snapshot.hasData).toBe(false);
    expect(snapshot.symbol).toBe("ESH6");
    expect(snapshot.last_price).toBe(0);
    expect(snapshot.session_open).toBe(0);
    expect(snapshot.session_high).toBe(0);
    expect(snapshot.session_low).toBe(0);
    expect(snapshot.prev_close).toBe(0);
    expect(snapshot.cum_volume).toBe(0);
    expect(snapshot.change).toBe(0);
    expect(snapshot.changePercent).toBe(0);
  });

  test("change helpers report no reference when no valid prices exist", () => {
    expect(resolveLastPrice({})).toBeNull();
    expect(resolveReferencePrice({})).toBeNull();
    expect(getChangeMetrics({})).toEqual({
      change: 0,
      changePercent: 0,
      hasReference: false,
    });
  });
});
