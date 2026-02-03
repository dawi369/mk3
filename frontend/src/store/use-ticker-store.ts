import { create } from "zustand";
import type { Bar } from "@/types/common.types";
import { MAX_COMPARISONS } from "@/types/ticker.types";
import type {
  Timeframe,
  TickerEntity,
  TickerMode,
  TickerSelectionState,
} from "@/types/ticker.types";
import {
  ASSET_CLASSES,
  getAssetClassForTicker,
  getTickerDetails,
} from "@/lib/ticker-mapping";
import { extractRoot } from "@/lib/month-utils";

const MAX_BARS = 300;

const emptySelection = (): TickerSelectionState => ({
  primary: null,
  selected: [],
  spreadEnabled: false,
});

const emptyAssetIndex = () =>
  ASSET_CLASSES.reduce(
    (acc, asset) => {
      acc[asset.id] = [];
      return acc;
    },
    {} as Record<(typeof ASSET_CLASSES)[number]["id"], string[]>,
  );

function buildEntity(mode: TickerMode, symbol: string): TickerEntity {
  const metadata = getTickerDetails(symbol);
  const productCode = metadata?.product_code || (mode === "front" ? extractRoot(symbol) : symbol);
  const assetClass = getAssetClassForTicker(symbol) ?? "unknown";
  const name = metadata?.name || symbol;

  return {
    symbol,
    mode,
    productCode,
    assetClass,
    name,
    metadata,
  };
}

function upsertSeries(current: Bar[] | undefined, nextBar: Bar): Bar[] {
  const existing = current ? [...current] : [];
  const lastBar = existing[existing.length - 1];

  if (lastBar && lastBar.startTime === nextBar.startTime) {
    existing[existing.length - 1] = nextBar;
    return existing;
  }

  const updated = [...existing, nextBar];
  if (updated.length > MAX_BARS) {
    return updated.slice(updated.length - MAX_BARS);
  }
  return updated;
}

interface TickerStoreState {
  mode: TickerMode;
  isModalOpen: boolean;
  entitiesByMode: Record<TickerMode, Record<string, TickerEntity>>;
  seriesByMode: Record<TickerMode, Record<string, Bar[]>>;
  byAssetClassByMode: Record<TickerMode, Record<string, string[]>>;
  selectionByMode: Record<TickerMode, TickerSelectionState>;
  timeframe: Timeframe;
  isSidebarOpen: boolean;

  setMode: (mode: TickerMode) => void;
  registerSymbols: (mode: TickerMode, symbols: string[]) => void;
  upsertBar: (mode: TickerMode, bar: Bar) => void;

  openPrimary: (symbol: string) => void;
  toggleSelectShift: (symbol: string) => void;
  addComparison: (symbol: string) => void;
  removeComparison: (symbol: string) => void;
  clearSelection: () => void;
  closeModal: () => void;

  setTimeframe: (tf: Timeframe) => void;
  toggleSidebar: () => void;
  setSpreadEnabled: (enabled: boolean) => void;
}

export const useTickerStore = create<TickerStoreState>((set, get) => ({
  mode: "front",
  isModalOpen: false,
  entitiesByMode: { front: {}, curve: {} },
  seriesByMode: { front: {}, curve: {} },
  byAssetClassByMode: { front: emptyAssetIndex(), curve: emptyAssetIndex() },
  selectionByMode: { front: emptySelection(), curve: emptySelection() },
  timeframe: "1h",
  isSidebarOpen: true,

  setMode: (mode) =>
    set((state) => ({
      mode,
      isModalOpen: false,
      selectionByMode: {
        ...state.selectionByMode,
        [mode]: state.selectionByMode[mode] || emptySelection(),
      },
    })),

  registerSymbols: (mode, symbols) =>
    set((state) => {
      const existing = state.entitiesByMode[mode];
      const nextEntities = { ...existing };
      const nextIndex = { ...state.byAssetClassByMode[mode] };

      for (const symbol of symbols) {
        if (nextEntities[symbol]) continue;
        const entity = buildEntity(mode, symbol);
        nextEntities[symbol] = entity;

        if (entity.assetClass !== "unknown") {
          const list = nextIndex[entity.assetClass] || [];
          if (!list.includes(symbol)) {
            nextIndex[entity.assetClass] = [...list, symbol];
          }
        }
      }

      return {
        entitiesByMode: { ...state.entitiesByMode, [mode]: nextEntities },
        byAssetClassByMode: { ...state.byAssetClassByMode, [mode]: nextIndex },
      };
    }),

  upsertBar: (mode, bar) =>
    set((state) => {
      const entities = { ...state.entitiesByMode[mode] };
      const series = { ...state.seriesByMode[mode] };
      const index = { ...state.byAssetClassByMode[mode] };

      if (!entities[bar.symbol]) {
        const entity = buildEntity(mode, bar.symbol);
        entities[bar.symbol] = entity;

        if (entity.assetClass !== "unknown") {
          const list = index[entity.assetClass] || [];
          if (!list.includes(bar.symbol)) {
            index[entity.assetClass] = [...list, bar.symbol];
          }
        }
      }

      const nextEntity = {
        ...entities[bar.symbol],
        latestBar: bar,
        lastUpdated: Date.now(),
      } as TickerEntity;

      entities[bar.symbol] = nextEntity;
      series[bar.symbol] = upsertSeries(series[bar.symbol], bar);

      return {
        entitiesByMode: { ...state.entitiesByMode, [mode]: entities },
        seriesByMode: { ...state.seriesByMode, [mode]: series },
        byAssetClassByMode: { ...state.byAssetClassByMode, [mode]: index },
      };
    }),

  openPrimary: (symbol) =>
    set((state) => {
      const mode = state.mode;
      return {
        isModalOpen: true,
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...state.selectionByMode[mode],
            primary: symbol,
            selected: [symbol],
          },
        },
      };
    }),

  toggleSelectShift: (symbol) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const selected = selection.selected;
      const isSelected = selected.includes(symbol);

      let nextSelected = selected;
      let nextPrimary = selection.primary;

      if (isSelected) {
        nextSelected = selected.filter((s) => s !== symbol);
        if (selection.primary === symbol) {
          nextPrimary = nextSelected.length > 0 ? nextSelected[0] : null;
        }
      } else {
        if (!nextPrimary) {
          nextPrimary = symbol;
          nextSelected = [symbol];
        } else if (selected.length < MAX_COMPARISONS + 1) {
          nextSelected = [...selected, symbol];
        }
      }

      const shouldOpen = !state.isModalOpen && nextSelected.length >= 2;

      return {
        isModalOpen: shouldOpen ? true : state.isModalOpen,
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            primary: nextPrimary,
            selected: nextSelected,
          },
        },
      };
    }),

  addComparison: (symbol) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const selected = selection.selected;
      const exists = selected.includes(symbol);

      if (exists) {
        return { isModalOpen: true };
      }

      if (!selection.primary) {
        return {
          isModalOpen: true,
          selectionByMode: {
            ...state.selectionByMode,
            [mode]: {
              ...selection,
              primary: symbol,
              selected: [symbol],
            },
          },
        };
      }

      if (selection.selected.length >= MAX_COMPARISONS + 1) {
        return { isModalOpen: true };
      }

      return {
        isModalOpen: true,
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            selected: [...selected, symbol],
          },
        },
      };
    }),

  removeComparison: (symbol) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const nextSelected = selection.selected.filter((s) => s !== symbol);
      const nextPrimary = selection.primary === symbol ? nextSelected[0] ?? null : selection.primary;

      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            primary: nextPrimary,
            selected: nextSelected,
          },
        },
      };
    }),

  clearSelection: () =>
    set((state) => {
      const mode = state.mode;
      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...state.selectionByMode[mode],
            selected: state.selectionByMode[mode].primary
              ? [state.selectionByMode[mode].primary as string]
              : [],
          },
        },
      };
    }),

  closeModal: () => set({ isModalOpen: false }),

  setTimeframe: (tf) => set({ timeframe: tf }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSpreadEnabled: (enabled) =>
    set((state) => {
      const mode = state.mode;
      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...state.selectionByMode[mode],
            spreadEnabled: enabled,
          },
        },
      };
    }),
}));
