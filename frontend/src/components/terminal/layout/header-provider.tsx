"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

// --- Row density type ---
export type VisibleRows = 3 | 4;

interface HeaderContextValue {
  navContent: ReactNode;
  setNavContent: (content: ReactNode) => void;
  // --- Row density state ---
  visibleRows: VisibleRows;
  setVisibleRows: (rows: VisibleRows) => void;
}

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined);

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
}

interface HeaderProviderProps {
  children: ReactNode;
}

export function HeaderProvider({ children }: HeaderProviderProps) {
  const [navContent, setNavContentState] = useState<ReactNode>(null);
  const [visibleRows, setVisibleRowsState] = useState<VisibleRows>(3);

  // Wrap in useCallback to maintain stable identity
  const setNavContent = useCallback((content: ReactNode) => {
    setNavContentState(content);
  }, []);

  const setVisibleRows = useCallback((rows: VisibleRows) => {
    setVisibleRowsState(rows);
  }, []);

  const value = useMemo(
    () => ({
      navContent,
      setNavContent,
      visibleRows,
      setVisibleRows,
    }),
    [navContent, setNavContent, visibleRows, setVisibleRows]
  );

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

