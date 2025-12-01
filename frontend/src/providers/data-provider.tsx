"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useConnection } from "./connection-provider";
import { Bar } from "@/types/common.types";

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
  const [marketData, setMarketData] = useState<MarketData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((message: any) => {
      if (message.type === "market_data") {
        const { symbol, ...barData } = message.data;

        if (!symbol) return;

        setMarketData((prev) => {
          const currentBars = prev[symbol] || [];

          // Construct the new bar
          const newBar: Bar = { symbol, ...barData };

          // If it's a snapshot, we are receiving historical data (oldest first usually, but let's handle both)
          // The backend sends `recentMessages.reverse()` so we get oldest -> newest.

          // Simple deduplication based on startTime
          // Optimization: If it's a live update (snapshot=false), we just append.
          // If it's a snapshot, we might be rebuilding state.

          // For now, let's just append and sort if needed, or check last bar.
          const lastBar = currentBars[currentBars.length - 1];

          if (lastBar && lastBar.startTime === newBar.startTime) {
            // Update existing bar (e.g. volume update)
            const updatedBars = [...currentBars];
            updatedBars[updatedBars.length - 1] = newBar;
            return { ...prev, [symbol]: updatedBars };
          }

          if (lastBar && lastBar.startTime > newBar.startTime) {
            // Out of order? Ignore or insert?
            // For simplicity in this version, we assume mostly ordered data.
            // If we receive older data, we might need to sort.
            // Let's just append for now to see it working.
            return { ...prev, [symbol]: [...currentBars, newBar] };
          }

          return {
            ...prev,
            [symbol]: [...currentBars, newBar],
          };
        });

        if (isLoading) setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [subscribe, isLoading]);

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
