import { create } from "zustand";
import type { Bar } from "@/types/common.types";
import type {
  SpreadLeg,
  Timeframe,
  TickerEntity,
  TickerMode,
  TickerSelectionState,
} from "@/types/ticker.types";
import { MAX_SPREAD_LEGS } from "@/types/ticker.types";
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
  spreadLegs: [],
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

function normalizeLegs(legs: SpreadLeg[], primary: string | null): SpreadLeg[] {
  const seen = new Set<string>();
  const normalized: SpreadLeg[] = [];

  for (const leg of legs) {
    if (!leg.symbol || seen.has(leg.symbol)) continue;
    if (normalized.length >= MAX_SPREAD_LEGS) break;
    normalized.push({ symbol: leg.symbol, weight: leg.weight || 1 });
    seen.add(leg.symbol);
  }

  if (primary && !seen.has(primary) && normalized.length < MAX_SPREAD_LEGS) {
    normalized.unshift({ symbol: primary, weight: 1 });
  }

  return normalized;
}

function buildDefaultLegs(selected: string[], primary: string | null): SpreadLeg[] {
  const legs: SpreadLeg[] = [];
  if (primary) {
    legs.push({ symbol: primary, weight: 1 });
  }
  for (const symbol of selected) {
    if (symbol === primary) continue;
    if (legs.length >= MAX_SPREAD_LEGS) break;
    legs.push({ symbol, weight: -1 });
  }
  return legs;
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
  toggleSpreadLegSign: (symbol: string) => void;
  moveSpreadLeg: (symbol: string, direction: -1 | 1) => void;
  reverseSpreadLegs: () => void;
  applySpreadPreset: (preset: "calendar" | "ratio" | "butterfly" | "condor") => void;
  clearSelection: () => void;
  closeModal: () => void;

  setTimeframe: (tf: Timeframe) => void;
  toggleSidebar: () => void;
  setSpreadEnabled: (enabled: boolean) => void;
}

export const useTickerStore = create<TickerStoreState>((set) => ({
  mode: "front",
  isModalOpen: false,
  entitiesByMode: { front: {}, curve: {} },
  seriesByMode: { front: {}, curve: {} },
  byAssetClassByMode: { front: emptyAssetIndex(), curve: emptyAssetIndex() },
  selectionByMode: { front: emptySelection(), curve: emptySelection() },
  timeframe: "1m",
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
      const selection = state.selectionByMode[mode];
      const nextSelected = [symbol];
      const nextSpreadLegs = selection.spreadEnabled
        ? buildDefaultLegs(nextSelected, symbol)
        : selection.spreadLegs;
      return {
        isModalOpen: true,
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            primary: symbol,
            selected: nextSelected,
            spreadLegs: nextSpreadLegs,
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
      let nextLegs = selection.spreadLegs;

      if (isSelected) {
        nextSelected = selected.filter((s) => s !== symbol);
        if (selection.primary === symbol) {
          nextPrimary = nextSelected.length > 0 ? nextSelected[0] : null;
        }
        if (selection.spreadEnabled) {
          nextLegs = nextLegs.filter((leg) => leg.symbol !== symbol);
        }
      } else {
        if (!nextPrimary) {
          nextPrimary = symbol;
          nextSelected = [symbol];
        } else {
          nextSelected = [...selected, symbol];
        }

        if (selection.spreadEnabled && nextLegs.length < MAX_SPREAD_LEGS) {
          nextLegs = normalizeLegs([...nextLegs, { symbol, weight: -1 }], nextPrimary);
        }
      }

      if (selection.spreadEnabled) {
        nextLegs = normalizeLegs(nextLegs, nextPrimary);
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
            spreadLegs: nextLegs,
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
              spreadLegs: selection.spreadEnabled
                ? buildDefaultLegs([symbol], symbol)
                : selection.spreadLegs,
            },
          },
        };
      }

      const nextSelected = [...selected, symbol];
      const nextLegs = selection.spreadEnabled
        ? normalizeLegs([...selection.spreadLegs, { symbol, weight: -1 }], selection.primary)
        : selection.spreadLegs;

      return {
        isModalOpen: true,
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            selected: nextSelected,
            spreadLegs: nextLegs,
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
      const nextLegs = selection.spreadEnabled
        ? normalizeLegs(
            selection.spreadLegs.filter((leg) => leg.symbol !== symbol),
            nextPrimary
          )
        : selection.spreadLegs;

      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            primary: nextPrimary,
            selected: nextSelected,
            spreadLegs: nextLegs,
          },
        },
      };
    }),

  toggleSpreadLegSign: (symbol) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const nextLegs = selection.spreadLegs.map((leg) =>
        leg.symbol === symbol ? { ...leg, weight: leg.weight * -1 } : leg
      );
      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            spreadLegs: nextLegs,
          },
        },
      };
    }),

  moveSpreadLeg: (symbol, direction) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const index = selection.spreadLegs.findIndex((leg) => leg.symbol === symbol);
      if (index === -1) return {};

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= selection.spreadLegs.length) return {};

      const nextLegs = [...selection.spreadLegs];
      const [leg] = nextLegs.splice(index, 1);
      nextLegs.splice(nextIndex, 0, leg);

      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            spreadLegs: nextLegs,
          },
        },
      };
    }),

  reverseSpreadLegs: () =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const nextLegs = selection.spreadLegs.map((leg) => ({
        ...leg,
        weight: leg.weight * -1,
      }));
      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            spreadLegs: nextLegs,
          },
        },
      };
    }),

  applySpreadPreset: (preset) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const ordered = selection.primary
        ? [selection.primary, ...selection.selected.filter((s) => s !== selection.primary)]
        : [...selection.selected];

      const weightsByPreset: Record<typeof preset, number[]> = {
        calendar: [1, -1],
        ratio: [1, -1],
        butterfly: [1, -2, 1],
        condor: [1, -1, -1, 1],
      };

      const weights = weightsByPreset[preset];
      if (ordered.length < weights.length) {
        return {};
      }

      const legs = weights.map((weight, idx) => ({
        symbol: ordered[idx],
        weight,
      }));

      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            spreadLegs: normalizeLegs(legs, selection.primary),
          },
        },
      };
    }),

  clearSelection: () =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const nextSelected = selection.primary ? [selection.primary as string] : [];
      const nextLegs = selection.spreadEnabled
        ? buildDefaultLegs(nextSelected, selection.primary)
        : selection.spreadLegs;
      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            selected: nextSelected,
            spreadLegs: nextLegs,
          },
        },
      };
    }),

  closeModal: () =>
    set((state) => {
      const mode = state.mode;
      return {
        isModalOpen: false,
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...state.selectionByMode[mode],
            primary: null,
            selected: [],
            spreadLegs: [],
          },
        },
      };
    }),

  setTimeframe: (tf) => set({ timeframe: tf }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSpreadEnabled: (enabled) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const nextLegs = enabled
        ? normalizeLegs(
            selection.spreadLegs.length > 0
              ? selection.spreadLegs
              : buildDefaultLegs(selection.selected, selection.primary),
            selection.primary
          )
        : selection.spreadLegs;
      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            spreadEnabled: enabled,
            spreadLegs: nextLegs,
          },
        },
      };
    }),
}));
