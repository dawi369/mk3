"use client";

import type { ReactNode } from "react";
import type { SpreadLeg, Timeframe } from "@/types/ticker.types";
import { useTickerStore } from "@/store/use-ticker-store";

// Symbol colors for chart overlay
export const SYMBOL_COLORS = [
  "#10b981", // emerald (primary)
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
] as const;

interface TickerModalState {
  isOpen: boolean;
  primarySymbol: string | null;
  comparisons: string[];
  spreadLegs: SpreadLeg[];
  open: (input: string | { ticker: string }) => void;
  close: () => void;

  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  showSessionLevels: boolean;
  toggleShowSessionLevels: () => void;

  addComparison: (symbol: string) => void;
  removeComparison: (symbol: string) => void;
  reorderSelection: (order: string[]) => void;
  reorderSelection: (order: string[]) => void;

  spreadEnabled: boolean;
  setSpreadEnabled: (enabled: boolean) => void;
  toggleSpreadLegSign: (symbol: string) => void;
  moveSpreadLeg: (symbol: string, direction: -1 | 1) => void;
  reverseSpreadLegs: () => void;
  applySpreadPreset: (preset: "calendar" | "ratio" | "butterfly" | "condor") => void;
}

export function useTickerModal(): TickerModalState {
  const mode = useTickerStore((state) => state.mode);
  const selection = useTickerStore((state) => state.selectionByMode[mode]);
  const isOpen = useTickerStore((state) => state.isModalOpen);
  const openPrimary = useTickerStore((state) => state.openPrimary);
  const close = useTickerStore((state) => state.closeModal);
  const timeframe = useTickerStore((state) => state.timeframe);
  const setTimeframe = useTickerStore((state) => state.setTimeframe);
  const isSidebarOpen = useTickerStore((state) => state.isSidebarOpen);
  const toggleSidebar = useTickerStore((state) => state.toggleSidebar);
  const setSidebarOpen = useTickerStore((state) => state.setSidebarOpen);
  const showSessionLevels = useTickerStore((state) => state.showSessionLevels);
  const toggleShowSessionLevels = useTickerStore((state) => state.toggleShowSessionLevels);
  const addComparison = useTickerStore((state) => state.addComparison);
  const removeComparison = useTickerStore((state) => state.removeComparison);
  const reorderSelection = useTickerStore((state) => state.reorderSelection);
  const setSpreadEnabled = useTickerStore((state) => state.setSpreadEnabled);
  const toggleSpreadLegSign = useTickerStore((state) => state.toggleSpreadLegSign);
  const moveSpreadLeg = useTickerStore((state) => state.moveSpreadLeg);
  const reverseSpreadLegs = useTickerStore((state) => state.reverseSpreadLegs);
  const applySpreadPreset = useTickerStore((state) => state.applySpreadPreset);

  const open = (input: string | { ticker: string }) => {
    const symbol = typeof input === "string" ? input : input.ticker;
    if (symbol) {
      openPrimary(symbol);
    }
  };

  const comparisons = selection.selected.filter((symbol) => symbol !== selection.primary);

  return {
    isOpen,
    primarySymbol: selection.primary,
    comparisons,
    spreadLegs: selection.spreadLegs,
    open,
    close,
    timeframe,
    setTimeframe,
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    showSessionLevels,
    toggleShowSessionLevels,
    addComparison,
    removeComparison,
    reorderSelection,
    spreadEnabled: selection.spreadEnabled,
    setSpreadEnabled,
    toggleSpreadLegSign,
    moveSpreadLeg,
    reverseSpreadLegs,
    applySpreadPreset,
  };
}

export function TickerModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
