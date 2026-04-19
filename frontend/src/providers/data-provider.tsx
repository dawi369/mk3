"use client";

import React, { useEffect, useRef } from "react";
import { useConnection } from "./connection-provider";
import { Bar } from "@/types/common.types";
import { useTickerStore } from "@/store/use-ticker-store";
import { NEXT_PUBLIC_HUB_URL } from "@/config/env";
import { getAllProductCodes } from "@/lib/ticker-mapping";
import { loadHubBootstrap, loadHubSessions, loadHubSnapshots } from "@/lib/hub/bootstrap";
import type { HubMessage } from "@/types/hub.types";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { subscribe } = useConnection();
  const applyMarketBootstrap = useTickerStore((state) => state.applyMarketBootstrap);
  const ingestBars = useTickerStore((state) => state.ingestBars);
  const setSnapshots = useTickerStore((state) => state.setSnapshots);
  const setSessions = useTickerStore((state) => state.setSessions);
  const pendingBarsRef = useRef<Bar[]>([]);
  const flushHandleRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    void loadHubBootstrap({
      baseUrl: NEXT_PUBLIC_HUB_URL,
      curveSymbols: getAllProductCodes(),
      signal: controller.signal,
    }).then((payload) => {
      applyMarketBootstrap(payload);
    });

    return () => {
      controller.abort();
    };
  }, [applyMarketBootstrap]);

  useEffect(() => {
    let active = true;

    const refreshMetadata = async () => {
      const [snapshots, sessions] = await Promise.all([
        loadHubSnapshots(NEXT_PUBLIC_HUB_URL),
        loadHubSessions(NEXT_PUBLIC_HUB_URL),
      ]);

      if (!active) return;
      setSnapshots(snapshots);
      setSessions(sessions);
    };

    void refreshMetadata();

    const sessionsInterval = window.setInterval(() => {
      void loadHubSessions(NEXT_PUBLIC_HUB_URL).then((sessions) => {
        if (active) setSessions(sessions);
      });
    }, 60_000);

    const snapshotsInterval = window.setInterval(() => {
      void loadHubSnapshots(NEXT_PUBLIC_HUB_URL).then((snapshots) => {
        if (active) setSnapshots(snapshots);
      });
    }, 5 * 60_000);

    return () => {
      active = false;
      window.clearInterval(sessionsInterval);
      window.clearInterval(snapshotsInterval);
    };
  }, [setSnapshots, setSessions]);

  useEffect(() => {
    const flush = () => {
      flushHandleRef.current = null;
      const queued = pendingBarsRef.current;
      if (queued.length === 0) return;
      pendingBarsRef.current = [];
      ingestBars("front", queued);
      hasLoadedRef.current = true;
    };

    const scheduleFlush = () => {
      if (flushHandleRef.current !== null) return;
      flushHandleRef.current = window.requestAnimationFrame(flush);
    };

    const unsubscribe = subscribe((message: HubMessage) => {
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
  }, [ingestBars, subscribe]);

  return <>{children}</>;
}
