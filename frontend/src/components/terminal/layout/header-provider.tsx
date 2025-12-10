"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

interface HeaderContextValue {
  navContent: ReactNode;
  setNavContent: (content: ReactNode) => void;
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

  // Wrap in useCallback to maintain stable identity
  const setNavContent = useCallback((content: ReactNode) => {
    setNavContentState(content);
  }, []);

  const value = useMemo(
    () => ({
      navContent,
      setNavContent,
    }),
    [navContent, setNavContent]
  );

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}
