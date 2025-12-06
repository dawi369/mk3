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

interface SpotlightContextValue {
  isOpen: boolean;
  open: () => void;
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

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
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
      open,
      close,
      toggle,
      commands,
      registerCommands,
      unregisterCommands,
    }),
    [isOpen, open, close, toggle, commands, registerCommands, unregisterCommands]
  );

  return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
}
