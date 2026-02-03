"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export interface SpotlightCommand {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  action: () => void;
  group: string;
}

export type SpotlightMode = "default" | "ticker-primary" | "ticker-compare";

interface SpotlightContextValue {
  isOpen: boolean;
  mode: SpotlightMode;
  open: () => void;
  openWithMode: (mode: SpotlightMode) => void;
  close: () => void;
  toggle: () => void;
  commands: SpotlightCommand[];
  registerCommands: (commands: SpotlightCommand[]) => void;
  unregisterCommands: (ids: string[]) => void;
}

const SpotlightContext = createContext<SpotlightContextValue | undefined>(undefined);

export function useSpotlight() {
  const context = useContext(SpotlightContext);
  if (!context) {
    throw new Error("useSpotlight must be used within a SpotlightProvider");
  }
  return context;
}

interface SpotlightProviderProps {
  children: ReactNode;
}

export function SpotlightProvider({ children }: SpotlightProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<SpotlightCommand[]>([]);
  const [mode, setMode] = useState<SpotlightMode>("default");

  const open = useCallback(() => {
    setMode("default");
    setIsOpen(true);
  }, []);

  const openWithMode = useCallback((nextMode: SpotlightMode) => {
    setMode(nextMode);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setMode("default");
  }, []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const registerCommands = useCallback((newCommands: SpotlightCommand[]) => {
    setCommands((prev) => {
      // Filter out any existing commands with the same IDs
      const existingIds = new Set(newCommands.map((c) => c.id));
      const filtered = prev.filter((c) => !existingIds.has(c.id));
      return [...filtered, ...newCommands];
    });
  }, []);

  const unregisterCommands = useCallback((ids: string[]) => {
    setCommands((prev) => prev.filter((c) => !ids.includes(c.id)));
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      open,
      openWithMode,
      close,
      toggle,
      commands,
      registerCommands,
      unregisterCommands,
    }),
    [isOpen, mode, open, openWithMode, close, toggle, commands, registerCommands, unregisterCommands]
  );

  return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
}
