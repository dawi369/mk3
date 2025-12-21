"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
  startTransition,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TerminalViewType } from "@/components/terminal/layout/terminal-dock";

interface TerminalViewContextValue {
  activeView: TerminalViewType;
  setActiveView: (view: TerminalViewType) => void;
  // Shared view settings to persist across switches
  timeframe: string;
  setTimeframe: (tf: string) => void;
  asset: string;
  setAsset: (asset: string) => void;
}

const TerminalViewContext = createContext<TerminalViewContextValue | undefined>(undefined);

export function useTerminalView() {
  const context = useContext(TerminalViewContext);
  if (!context) {
    throw new Error("useTerminalView must be used within a TerminalViewProvider");
  }
  return context;
}

const VALID_VIEWS: TerminalViewType[] = ["terminal", "indicators", "sentiment", "ai-lab"];

function isValidView(view: string | null): view is TerminalViewType {
  return view !== null && VALID_VIEWS.includes(view as TerminalViewType);
}

export function TerminalViewProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams.get("view");

  // Initialize from URL or default
  const [activeView, setActiveViewInternal] = useState<TerminalViewType>(
    isValidView(viewParam) ? viewParam : "terminal"
  );

  // Persisted settings across view switches
  const [timeframe, setTimeframe] = useState("1H");
  const [asset, setAsset] = useState("ES");

  // Load from localStorage on mount
  useEffect(() => {
    const savedTimeframe = localStorage.getItem("terminal-settings-timeframe");
    const savedAsset = localStorage.getItem("terminal-settings-asset");

    if (savedTimeframe) setTimeframe(savedTimeframe);
    if (savedAsset) setAsset(savedAsset);
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem("terminal-settings-timeframe", timeframe);
  }, [timeframe]);

  useEffect(() => {
    localStorage.setItem("terminal-settings-asset", asset);
  }, [asset]);

  // Synchronized view changer
  const setActiveView = useCallback(
    (view: TerminalViewType) => {
      // Update local state immediately for fast response
      setActiveViewInternal(view);

      // Update the URL. This will trigger the searchParams to change,
      // but we handle the sync carefully in the effect below.
      startTransition(() => {
        router.replace(`/terminal?view=${view}`, { scroll: false });
      });
    },
    [router]
  );

  // Sync state if URL changes from external source (back/forward buttons)
  useEffect(() => {
    // We use a functional update to check the current state without adding it to dependencies.
    // This is the cleanest way to sync the URL to state without triggering flip-flops.
    if (isValidView(viewParam)) {
      setActiveViewInternal((current) => (current !== viewParam ? viewParam : current));
    }
  }, [viewParam]); // Only depend on viewParam to avoid state -> URL -> state bounce.

  const value = useMemo(
    () => ({
      activeView,
      setActiveView,
      timeframe,
      setTimeframe,
      asset,
      setAsset,
    }),
    [activeView, setActiveView, timeframe, asset]
  );

  return <TerminalViewContext.Provider value={value}>{children}</TerminalViewContext.Provider>;
}
