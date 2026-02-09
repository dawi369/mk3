"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useConnection } from "./connection-provider";
import { Bar } from "@/types/common.types";
import { useTickerStore } from "@/store/use-ticker-store";
import { NEXT_PUBLIC_HUB_URL } from "@/config/env";
import { getAllProductCodes } from "@/lib/ticker-mapping";
import type { SnapshotData, SessionData } from "@/types/redis.types";

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
  const registerSymbols = useTickerStore((state) => state.registerSymbols);
  const upsertBar = useTickerStore((state) => state.upsertBar);
  const setSnapshots = useTickerStore((state) => state.setSnapshots);
  const setSessions = useTickerStore((state) => state.setSessions);
  const [isLoading, setIsLoading] = useState(true);
  const pendingBarsRef = useRef<Bar[]>([]);
  const flushHandleRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadSymbols = async () => {
      try {
        registerSymbols("curve", getAllProductCodes());
        const response = await fetch(`${NEXT_PUBLIC_HUB_URL}/symbols`);
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted) return;
        const symbols = Array.isArray(data) ? data : data?.symbols;
        if (!Array.isArray(symbols)) return;
        registerSymbols("front", symbols);
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
    let mounted = true;
    let sessionsInterval: number | null = null;

    const loadSnapshots = async () => {
      try {
        const response = await fetch(`${NEXT_PUBLIC_HUB_URL}/snapshots`);
        if (!response.ok) return;
        const payload = await response.json();
        const snapshots = payload?.snapshots as Record<string, SnapshotData> | undefined;
        if (!mounted || !snapshots) return;
        setSnapshots(snapshots);
      } catch (err) {
        console.warn("[DataProvider] Failed to load snapshots", err);
      }
    };

    const loadSessions = async () => {
      try {
        const response = await fetch(`${NEXT_PUBLIC_HUB_URL}/sessions`);
        if (!response.ok) return;
        const payload = await response.json();
        const sessions = payload?.sessions as Record<string, SessionData> | undefined;
        if (!mounted || !sessions) return;
        setSessions(sessions);
      } catch (err) {
        console.warn("[DataProvider] Failed to load sessions", err);
      }
    };

    loadSnapshots();
    loadSessions();

    sessionsInterval = window.setInterval(loadSessions, 30_000);

    return () => {
      mounted = false;
      if (sessionsInterval !== null) {
        window.clearInterval(sessionsInterval);
      }
    };
  }, [setSnapshots, setSessions]);

  useEffect(() => {
    const flush = () => {
      flushHandleRef.current = null;
      const queued = pendingBarsRef.current;
      if (queued.length === 0) return;
      pendingBarsRef.current = [];
      for (const bar of queued) {
        upsertBar("front", bar);
      }
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        setIsLoading(false);
      }
    };

    const scheduleFlush = () => {
      if (flushHandleRef.current !== null) return;
      flushHandleRef.current = window.requestAnimationFrame(flush);
    };

    const unsubscribe = subscribe((message: any) => {
      if (message.type === "info") {
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

        pendingBarsRef.current.push({ symbol, ...barData });
        scheduleFlush();
      }
    });

    return () => {
      if (flushHandleRef.current !== null) {
        window.cancelAnimationFrame(flushHandleRef.current);
      }
      unsubscribe();
    };
  }, [subscribe, upsertBar]);

  const getLatestBar = (symbol: string) => {
    return useTickerStore.getState().entitiesByMode.front[symbol]?.latestBar;
  };

  return (
    <DataContext.Provider
      value={{
        marketData: useTickerStore.getState().seriesByMode.front,
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
