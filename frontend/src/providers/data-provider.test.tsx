import { PropsWithChildren } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/setup";
import { DataProvider } from "@/providers/data-provider";
import { useTickerStore } from "@/store/use-ticker-store";
import { makeSession, makeSnapshot } from "@/tests/factories";

const subscribeMock = vi.fn();

vi.mock("@/providers/connection-provider", () => ({
  useConnection: () => ({
    status: "connected",
    lastMessageAt: null,
    lastError: null,
    reconnect: vi.fn(),
    send: vi.fn(),
    subscribe: subscribeMock,
  }),
}));

function StoreProbe({ children }: PropsWithChildren) {
  return <DataProvider>{children}</DataProvider>;
}

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

describe("DataProvider", () => {
  beforeEach(() => {
    resetTickerStore();
    subscribeMock.mockReset();
    subscribeMock.mockImplementation((callback: (message: unknown) => void) => {
      queueMicrotask(() => {
        callback({
          type: "market_data",
          data: {
            symbol: "ESH6",
            open: 100,
            high: 101,
            low: 99,
            close: 100.5,
            volume: 1000,
            trades: 10,
            startTime: 1000,
            endTime: 2000,
          },
        });
      });
      return () => {};
    });

    server.use(
      http.get("http://localhost:3005/symbols", () =>
        HttpResponse.json({ symbols: ["ESH6"] }),
      ),
      http.get("http://localhost:3005/snapshots", () =>
        HttpResponse.json({ snapshots: { ESH6: makeSnapshot() } }),
      ),
      http.get("http://localhost:3005/sessions", () =>
        HttpResponse.json({ sessions: { ESH6: makeSession() } }),
      ),
    );
  });

  test("bootstraps metadata and ingests websocket bars into the registry store", async () => {
    render(<StoreProbe />);

    await waitFor(() => {
      const state = useTickerStore.getState();
      expect(state.entitiesByMode.front.ESH6).toBeDefined();
      expect(state.entitiesByMode.curve.ES).toBeDefined();
      expect(state.snapshotsBySymbol.ESH6?.productCode).toBe("ES");
      expect(state.sessionsBySymbol.ESH6?.sessionId).toBe("2026-03-25");
      expect(state.entitiesByMode.front.ESH6?.latestBar?.close).toBe(100.5);
    });
  });
});
