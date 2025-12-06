"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { MarketMover } from "./mock-data";

interface TickerModalContextValue {
  isOpen: boolean;
  ticker: MarketMover | null;
  open: (ticker: MarketMover) => void;
  close: () => void;
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
  const [isOpen, setIsOpen] = useState(false);
  const [ticker, setTicker] = useState<MarketMover | null>(null);

  const open = useCallback((newTicker: MarketMover) => {
    setTicker(newTicker);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing ticker to allow exit animation
    setTimeout(() => setTicker(null), 300);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      ticker,
      open,
      close,
    }),
    [isOpen, ticker, open, close]
  );

  return <TickerModalContext.Provider value={value}>{children}</TickerModalContext.Provider>;
}
