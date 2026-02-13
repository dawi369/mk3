import { create } from "zustand";
import type { Bar } from "@/types/common.types";
import type {
  SpreadLeg,
  SpreadPresetId,
  Timeframe,
  TickerEntity,
  TickerMode,
  TickerSelectionState,
} from "@/types/ticker.types";
import type { SnapshotData, SessionData } from "@/types/redis.types";
import { MAX_SPREAD_LEGS } from "@/types/ticker.types";
import {
  ASSET_CLASSES,
  getAssetClassForTicker,
  getTickerDetails,
} from "@/lib/ticker-mapping";
import { extractRoot } from "@/lib/month-utils";

const MAX_BARS_DEFAULT = 86400;
const MAX_BARS_TRACKED = 86400;
const MAX_COMPARISONS = 4;

function getStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return fallback;
}

const emptySelection = (): TickerSelectionState => ({
  primary: null,
  selected: [],
  spreadEnabled: false,
  spreadLegs: [],
  spreadPreset: "calendar",
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

function upsertSeries(current: Bar[] | undefined, nextBar: Bar, limit: number): Bar[] {
  const existing = current ? [...current] : [];
  const lastBar = existing[existing.length - 1];

  if (lastBar && lastBar.startTime === nextBar.startTime) {
    existing[existing.length - 1] = nextBar;
    return existing;
  }

  const updated = [...existing, nextBar];
  if (updated.length > limit) {
    return updated.slice(updated.length - limit);
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

const PRESET_WEIGHTS: Record<SpreadPresetId, number[]> = {
  calendar: [1, -1],
  butterfly: [1, -2, 1],
  condor: [1, -1, -1, 1],
};

/** Build spread legs from an ordered symbol list and a preset. Falls back to calendar if not enough symbols. */
function applyPresetWeights(
  ordered: string[],
  preset: SpreadPresetId,
  primary: string | null,
): { legs: SpreadLeg[]; preset: SpreadPresetId } {
  let weights = PRESET_WEIGHTS[preset];
  let activePreset = preset;
  // Fall back to calendar if not enough symbols for the requested preset
  if (ordered.length < weights.length) {
    weights = PRESET_WEIGHTS.calendar;
    activePreset = "calendar";
  }
  const legs = weights.map((weight, idx) => ({
    symbol: ordered[idx] ?? "",
    weight,
  })).filter(leg => leg.symbol !== "");
  return { legs: normalizeLegs(legs, primary), preset: activePreset };
}

function orderSelection(primary: string | null, selected: string[]): string[] {
  if (!primary) return selected;
  const rest = selected.filter((symbol) => symbol !== primary);
  return [primary, ...rest];
}

interface TickerStoreState {
  mode: TickerMode;
  isModalOpen: boolean;
  entitiesByMode: Record<TickerMode, Record<string, TickerEntity>>;
  seriesByMode: Record<TickerMode, Record<string, Bar[]>>;
  byAssetClassByMode: Record<TickerMode, Record<string, string[]>>;
  trackedSymbolsByMode: Record<TickerMode, Record<string, true>>;
  selectionByMode: Record<TickerMode, TickerSelectionState>;
  snapshotsBySymbol: Record<string, SnapshotData>;
  sessionsBySymbol: Record<string, SessionData>;
  timeframe: Timeframe;
  isSidebarOpen: boolean;
  showSessionLevels: boolean;

  setMode: (mode: TickerMode) => void;
  registerSymbols: (mode: TickerMode, symbols: string[]) => void;
  upsertBar: (mode: TickerMode, bar: Bar) => void;
  setTrackedSymbols: (symbols: string[]) => void;
  setSnapshots: (snapshots: Record<string, SnapshotData>) => void;
  setSessions: (sessions: Record<string, SessionData>) => void;

  openPrimary: (symbol: string) => void;
  toggleSelectShift: (symbol: string) => void;
  addComparison: (symbol: string) => void;
  removeComparison: (symbol: string) => void;
  reorderSelection: (order: string[]) => void;
  toggleSpreadLegSign: (symbol: string) => void;
  moveSpreadLeg: (symbol: string, direction: -1 | 1) => void;
  reverseSpreadLegs: () => void;
  applySpreadPreset: (preset: SpreadPresetId) => void;
  clearSelection: () => void;
  closeModal: () => void;

  setTimeframe: (tf: Timeframe) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setShowSessionLevels: (enabled: boolean) => void;
  toggleShowSessionLevels: () => void;
  setSpreadEnabled: (enabled: boolean) => void;
}

export const useTickerStore = create<TickerStoreState>((set) => ({
  mode: "front",
  isModalOpen: false,
  entitiesByMode: { front: {}, curve: {} },
  seriesByMode: { front: {}, curve: {} },
  byAssetClassByMode: { front: emptyAssetIndex(), curve: emptyAssetIndex() },
  trackedSymbolsByMode: { front: {}, curve: {} },
  selectionByMode: { front: emptySelection(), curve: emptySelection() },
  snapshotsBySymbol: {},
  sessionsBySymbol: {},
  timeframe: "1m",
  isSidebarOpen: getStoredBoolean("terminal-chart-sidebar-open", true),
  showSessionLevels: false,

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
      const tracked = state.trackedSymbolsByMode[mode];

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
      const limit = tracked[bar.symbol] ? MAX_BARS_TRACKED : MAX_BARS_DEFAULT;
      series[bar.symbol] = upsertSeries(series[bar.symbol], bar, limit);

      return {
        entitiesByMode: { ...state.entitiesByMode, [mode]: entities },
        seriesByMode: { ...state.seriesByMode, [mode]: series },
        byAssetClassByMode: { ...state.byAssetClassByMode, [mode]: index },
      };
    }),

  setTrackedSymbols: (symbols) =>
    set((state) => {
      const mode = state.mode;
      const nextTracked = symbols.reduce((acc, symbol) => {
        acc[symbol] = true;
        return acc;
      }, {} as Record<string, true>);
      return {
        trackedSymbolsByMode: {
          ...state.trackedSymbolsByMode,
          [mode]: nextTracked,
        },
      };
    }),

  setSnapshots: (snapshots) =>
    set(() => ({
      snapshotsBySymbol: snapshots,
    })),

  setSessions: (sessions) =>
    set(() => ({
      sessionsBySymbol: sessions,
    })),

  openPrimary: (symbol) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const nextSelected = [symbol];
      let nextLegs = selection.spreadLegs;
      let nextPreset = selection.spreadPreset;
      if (selection.spreadEnabled) {
        const result = applyPresetWeights(nextSelected, selection.spreadPreset, symbol);
        nextLegs = result.legs;
        nextPreset = result.preset;
      }
      return {
        isModalOpen: true,
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            primary: symbol,
            selected: nextSelected,
            spreadLegs: nextLegs,
            spreadPreset: nextPreset,
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
        } else {
          // Enforce comparison limit
          if (selected.length >= MAX_COMPARISONS + 1) return {};
          nextSelected = [...selected, symbol];
        }
      }

      let nextLegs = selection.spreadLegs;
      let nextPreset = selection.spreadPreset;
      if (selection.spreadEnabled) {
        const ordered = orderSelection(nextPrimary, nextSelected);
        const result = applyPresetWeights(ordered, selection.spreadPreset, nextPrimary);
        nextLegs = result.legs;
        nextPreset = result.preset;
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
            spreadPreset: nextPreset,
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

      // Enforce comparison limit (selected includes primary)
      if (selection.primary && selected.length >= MAX_COMPARISONS + 1) {
        return { isModalOpen: true };
      }

      if (!selection.primary) {
        const nextSelected = [symbol];
        const result = selection.spreadEnabled
          ? applyPresetWeights(nextSelected, selection.spreadPreset, symbol)
          : { legs: selection.spreadLegs, preset: selection.spreadPreset };
        return {
          isModalOpen: true,
          selectionByMode: {
            ...state.selectionByMode,
            [mode]: {
              ...selection,
              primary: symbol,
              selected: nextSelected,
              spreadLegs: result.legs,
              spreadPreset: result.preset,
            },
          },
        };
      }

      const nextSelected = [...selected, symbol];
      const ordered = orderSelection(selection.primary, nextSelected);
      let nextLegs = selection.spreadLegs;
      let nextPreset = selection.spreadPreset;
      if (selection.spreadEnabled) {
        const result = applyPresetWeights(ordered, selection.spreadPreset, selection.primary);
        nextLegs = result.legs;
        nextPreset = result.preset;
      }

      return {
        isModalOpen: true,
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            selected: nextSelected,
            spreadLegs: nextLegs,
            spreadPreset: nextPreset,
          },
        },
      };
    }),

  removeComparison: (symbol) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const nextSelectedRaw = selection.selected.filter((s) => s !== symbol);
      const nextPrimary = selection.primary === symbol ? nextSelectedRaw[0] ?? null : selection.primary;
      const nextSelected = orderSelection(nextPrimary, nextSelectedRaw);
      let nextLegs = selection.spreadLegs;
      let nextPreset = selection.spreadPreset;
      if (selection.spreadEnabled) {
        const ordered = orderSelection(nextPrimary, nextSelected);
        const result = applyPresetWeights(ordered, selection.spreadPreset, nextPrimary);
        nextLegs = result.legs;
        nextPreset = result.preset;
      } else {
        nextLegs = selection.spreadLegs.filter((leg) => leg.symbol !== symbol);
      }

      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            primary: nextPrimary,
            selected: nextSelected,
            spreadLegs: nextLegs,
            spreadPreset: nextPreset,
          },
        },
      };
    }),

  reorderSelection: (order) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const allowed = new Set(selection.selected);
      const nextOrdered = order.filter((symbol) => allowed.has(symbol));
      const missing = selection.selected.filter((symbol) => !nextOrdered.includes(symbol));
      const nextSelected = [...nextOrdered, ...missing];
      const nextPrimary = nextSelected[0] ?? null;
      const nextLegs = selection.spreadEnabled
        ? normalizeLegs(selection.spreadLegs, nextPrimary)
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

      const result = applyPresetWeights(ordered, preset, selection.primary);

      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            spreadLegs: result.legs,
            spreadPreset: result.preset,
          },
        },
      };
    }),

  clearSelection: () =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      const nextSelected = selection.primary ? [selection.primary as string] : [];
      let nextLegs = selection.spreadLegs;
      let nextPreset = selection.spreadPreset;
      if (selection.spreadEnabled) {
        const ordered = orderSelection(selection.primary, nextSelected);
        const result = applyPresetWeights(ordered, selection.spreadPreset, selection.primary);
        nextLegs = result.legs;
        nextPreset = result.preset;
      }
      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            selected: nextSelected,
            spreadLegs: nextLegs,
            spreadPreset: nextPreset,
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
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setShowSessionLevels: (enabled) => set({ showSessionLevels: enabled }),
  toggleShowSessionLevels: () =>
    set((state) => ({ showSessionLevels: !state.showSessionLevels })),
  setSpreadEnabled: (enabled) =>
    set((state) => {
      const mode = state.mode;
      const selection = state.selectionByMode[mode];
      let nextLegs = selection.spreadLegs;
      let nextPreset = selection.spreadPreset;
      if (enabled) {
        const ordered = orderSelection(selection.primary, selection.selected);
        const result = applyPresetWeights(ordered, selection.spreadPreset, selection.primary);
        nextLegs = result.legs;
        nextPreset = result.preset;
      }
      return {
        selectionByMode: {
          ...state.selectionByMode,
          [mode]: {
            ...selection,
            spreadEnabled: enabled,
            spreadLegs: nextLegs,
            spreadPreset: nextPreset,
          },
        },
      };
    }),
}));
