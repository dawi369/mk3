"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { FrontMonthCache, FrontMonthInfo } from "@/types/front-month.types";
import { NEXT_PUBLIC_HUB_URL } from "@/config/env";

interface FrontMonthContextType {
  /** Get the front month ticker for a product code */
  getFrontMonth: (productCode: string) => string | null;
  /** Get the nearest expiry ticker for a product code */
  getNearestExpiry: (productCode: string) => string | null;
  /** Check if a product is currently in a roll period */
  isRolling: (productCode: string) => boolean;
  /** Get full info for a product */
  getInfo: (productCode: string) => FrontMonthInfo | null;
  /** Raw cache data */
  cache: FrontMonthCache | null;
  /** Loading state */
  isLoading: boolean;
  /** Last fetch error */
  error: string | null;
  /** Manually refresh data */
  refresh: () => Promise<void>;
}

const FrontMonthContext = createContext<FrontMonthContextType | null>(null);

export function FrontMonthProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<FrontMonthCache | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFrontMonths = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${NEXT_PUBLIC_HUB_URL}/front-months`);

      if (!response.ok) {
        throw new Error(`Failed to fetch front months: ${response.status}`);
      }

      const data: FrontMonthCache = await response.json();
      setCache(data);
      console.log(
        `[FrontMonthProvider] Loaded ${Object.keys(data.products || {}).length} products`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[FrontMonthProvider] Error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFrontMonths();
  }, [fetchFrontMonths]);

  // Refresh every hour
  useEffect(() => {
    const interval = setInterval(fetchFrontMonths, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFrontMonths]);

  // Refresh on window focus (if stale > 5 min)
  useEffect(() => {
    const handleFocus = () => {
      if (cache?.lastUpdated) {
        const staleMinutes = (Date.now() - cache.lastUpdated) / 1000 / 60;
        if (staleMinutes > 5) {
          fetchFrontMonths();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [cache?.lastUpdated, fetchFrontMonths]);

  const getFrontMonth = useCallback(
    (productCode: string): string | null => {
      return cache?.products[productCode]?.frontMonth ?? null;
    },
    [cache]
  );

  const getNearestExpiry = useCallback(
    (productCode: string): string | null => {
      return cache?.products[productCode]?.nearestExpiry ?? null;
    },
    [cache]
  );

  const isRolling = useCallback(
    (productCode: string): boolean => {
      return cache?.products[productCode]?.isRolling ?? false;
    },
    [cache]
  );

  const getInfo = useCallback(
    (productCode: string): FrontMonthInfo | null => {
      return cache?.products[productCode] ?? null;
    },
    [cache]
  );

  return (
    <FrontMonthContext.Provider
      value={{
        getFrontMonth,
        getNearestExpiry,
        isRolling,
        getInfo,
        cache,
        isLoading,
        error,
        refresh: fetchFrontMonths,
      }}
    >
      {children}
    </FrontMonthContext.Provider>
  );
}

export const useFrontMonth = () => {
  const context = useContext(FrontMonthContext);
  if (!context) {
    throw new Error("useFrontMonth must be used within a FrontMonthProvider");
  }
  return context;
};

/**
 * Hook to check if useFrontMonth is available (provider is mounted)
 * Returns null if no provider, context if available
 */
export const useFrontMonthOptional = () => {
  return useContext(FrontMonthContext);
};
