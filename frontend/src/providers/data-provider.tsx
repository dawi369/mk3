"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useConnection } from "./connection-provider";
import { Bar } from "@/types/common.types";
import { useTickerStore } from "@/store/use-ticker-store";
import { NEXT_PUBLIC_HUB_URL } from "@/config/env";
import { getAllProductCodes } from "@/lib/ticker-mapping";

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
  const mode = useTickerStore((state) => state.mode);
  const registerSymbols = useTickerStore((state) => state.registerSymbols);
  const upsertBar = useTickerStore((state) => state.upsertBar);
  const entities = useTickerStore((state) => state.entitiesByMode[mode]);
  const series = useTickerStore((state) => state.seriesByMode[mode]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSymbols = async () => {
      try {
        registerSymbols("curve", getAllProductCodes());
        const response = await fetch(`${NEXT_PUBLIC_HUB_URL}/symbols`);
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted || !Array.isArray(data)) return;
        registerSymbols("front", data);
      } catch (err) {
        console.warn("[DataProvider] Failed to load symbols", err);
      }
    };

    loadSymbols();
    return () => {
      mounted = false;
    };
  }, [registerSymbols]);

  useEffect(() => {
    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((message: any) => {
      // Handle info messages from backend
      if (message.type === "info") {
        console.log("ℹ️ [Hub]", message.message);
        return;
      }

      if (message.type === "market_data") {
        const { symbol, ...barData } = message.data;
        if (!symbol) {
          console.warn(
            "⚠️ [DataProvider] Received market_data without symbol:",
            message,
          );
          return;
        }

        upsertBar("front", { symbol, ...barData });
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [subscribe, upsertBar, setIsLoading]);

  const getLatestBar = (symbol: string) => {
    return entities[symbol]?.latestBar;
  };

  return (
    <DataContext.Provider
      value={{
        marketData: series,
        isLoading: isLoading && status !== "connected",
        getLatestBar,
      }}
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
