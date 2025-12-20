"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useConnection } from "./connection-provider";
import { Bar } from "@/types/common.types";
import { useMarketStore } from "@/store/use-market-store";

interface MarketData {
  [symbol: string]: Bar[];
}

interface DataContextType {
  marketData: MarketData;
  isLoading: boolean;
  getLatestBar: (symbol: string) => Bar | undefined;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { subscribe, status } = useConnection();
  const handleMarketUpdate = useMarketStore((state) => state.handleMarketUpdate);
  const setIsLoading = useMarketStore((state) => state.setIsLoading);
  const marketData = useMarketStore((state) => state.marketData);
  const isLoading = useMarketStore((state) => state.isLoading);

  useEffect(() => {
    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((message: any) => {
      if (message.type === "market_data") {
        const { symbol, ...barData } = message.data;
        if (!symbol) return;

        // Update the global store instead of local state
        handleMarketUpdate(symbol, { symbol, ...barData });
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [subscribe, handleMarketUpdate, setIsLoading]);

  const getLatestBar = (symbol: string) => {
    const bars = marketData[symbol];
    return bars ? bars[bars.length - 1] : undefined;
  };

  return (
    <DataContext.Provider
      value={{ marketData, isLoading: isLoading && status !== "connected", getLatestBar }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
