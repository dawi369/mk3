"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { MarketMover } from "@/components/terminal/_shared/mock-data";

// Timeframe options
export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

// Max comparison symbols
export const MAX_COMPARISONS = 3;

// Symbol colors for chart overlay
export const SYMBOL_COLORS = [
  "#10b981", // emerald (primary)
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
] as const;

interface TickerModalContextValue {
  // Modal state
  isOpen: boolean;
  ticker: MarketMover | null;
  open: (ticker: MarketMover) => void;
  close: () => void;

  // Chart state
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  comparisons: string[]; // Additional tickers to overlay
  addComparison: (ticker: string) => void;
  removeComparison: (ticker: string) => void;
  clearComparisons: () => void;

  // Sidebar state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const TickerModalContext = createContext<TickerModalContextValue | undefined>(undefined);

export function useTickerModal() {
  const context = useContext(TickerModalContext);
  if (!context) {
    throw new Error("useTickerModal must be used within a TickerModalProvider");
  }
  return context;
}

interface TickerModalProviderProps {
  children: ReactNode;
}

export function TickerModalProvider({ children }: TickerModalProviderProps) {
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [ticker, setTicker] = useState<MarketMover | null>(null);

  // Chart state
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [comparisons, setComparisons] = useState<string[]>([]);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const open = useCallback((newTicker: MarketMover) => {
    setTicker(newTicker);
    setComparisons([]); // Clear comparisons when opening new ticker
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setTicker(null);
      setComparisons([]);
    }, 300);
  }, []);

  const addComparison = useCallback((tickerSymbol: string) => {
    setComparisons((prev) => {
      if (prev.includes(tickerSymbol) || prev.length >= MAX_COMPARISONS) return prev;
      return [...prev, tickerSymbol];
    });
  }, []);

  const removeComparison = useCallback((tickerSymbol: string) => {
    setComparisons((prev) => prev.filter((t) => t !== tickerSymbol));
  }, []);

  const clearComparisons = useCallback(() => {
    setComparisons([]);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      ticker,
      open,
      close,
      timeframe,
      setTimeframe,
      comparisons,
      addComparison,
      removeComparison,
      clearComparisons,
      isSidebarOpen,
      toggleSidebar,
    }),
    [
      isOpen,
      ticker,
      open,
      close,
      timeframe,
      comparisons,
      addComparison,
      removeComparison,
      clearComparisons,
      isSidebarOpen,
      toggleSidebar,
    ]
  );

  return <TickerModalContext.Provider value={value}>{children}</TickerModalContext.Provider>;
}
