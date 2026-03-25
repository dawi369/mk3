import { beforeEach, describe, expect, test } from "vitest";
import { useTickerStore } from "@/store/use-ticker-store";
import { makeBar, makeSession, makeSnapshot } from "@/tests/factories";

function resetTickerStore() {
  useTickerStore.setState({
    mode: "front",
    isModalOpen: false,
    entitiesByMode: { front: {}, curve: {} },
    seriesByMode: { front: {}, curve: {} },
    byAssetClassByMode: {
      front: {
        indices: [],
        metals: [],
        grains: [],
        currencies: [],
        volatiles: [],
        softs: [],
      },
      curve: {
        indices: [],
        metals: [],
        grains: [],
        currencies: [],
        volatiles: [],
        softs: [],
      },
    },
    trackedSymbolsByMode: { front: {}, curve: {} },
    selectionByMode: {
      front: {
        primary: null,
        selected: [],
        spreadEnabled: false,
        spreadLegs: [],
        spreadPreset: "calendar",
      },
      curve: {
        primary: null,
        selected: [],
        spreadEnabled: false,
        spreadLegs: [],
        spreadPreset: "calendar",
      },
    },
    snapshotsBySymbol: {},
    sessionsBySymbol: {},
    timeframe: "1m",
    isSidebarOpen: true,
    showSessionLevels: false,
  });
}

describe("useTickerStore market data", () => {
  beforeEach(() => {
    resetTickerStore();
  });

  test("applies bootstrap data into the shared registry store", () => {
    useTickerStore.getState().applyMarketBootstrap({
      frontSymbols: ["ESH6", "GCH6"],
      curveSymbols: ["ES", "GC"],
      snapshots: { ESH6: makeSnapshot(), GCH6: makeSnapshot({ productCode: "GC" }) },
      sessions: { ESH6: makeSession(), GCH6: makeSession({ rootSymbol: "GC" }) },
    });

    const state = useTickerStore.getState();
    expect(state.entitiesByMode.front.ESH6?.productCode).toBe("ES");
    expect(state.entitiesByMode.curve.GC?.mode).toBe("curve");
    expect(state.snapshotsBySymbol.GCH6?.productCode).toBe("GC");
    expect(state.sessionsBySymbol.GCH6?.rootSymbol).toBe("GC");
  });

  test("ingests bars in batches and updates latest bars without duplicating timestamps", () => {
    const first = makeBar({ symbol: "ESH6", startTime: 1000, endTime: 2000, close: 100.5 });
    const duplicate = makeBar({ symbol: "ESH6", startTime: 1000, endTime: 2000, close: 101.25 });
    const second = makeBar({ symbol: "ESH6", startTime: 2000, endTime: 3000, close: 102 });
    const other = makeBar({ symbol: "GCH6", startTime: 1000, endTime: 2000, close: 2050 });

    useTickerStore.getState().ingestBars("front", [first, duplicate, second, other]);

    const state = useTickerStore.getState();
    expect(state.seriesByMode.front.ESH6).toHaveLength(2);
    expect(state.seriesByMode.front.ESH6?.[0]?.close).toBe(101.25);
    expect(state.entitiesByMode.front.ESH6?.latestBar?.close).toBe(102);
    expect(state.entitiesByMode.front.GCH6?.latestBar?.close).toBe(2050);
  });
});
