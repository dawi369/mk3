"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DisplayMode = "single" | "compare" | "spread";

interface DisplayModeTransitionOptions {
  targetMode: DisplayMode;
  primarySymbol: string | null;
  modeSwitchMs?: number;
  modeFadeMs?: number;
  symbolFlashMs?: number;
}

export function useDisplayModeTransition({
  targetMode,
  primarySymbol,
  modeSwitchMs = 120,
  modeFadeMs = 260,
  symbolFlashMs = 160,
}: DisplayModeTransitionOptions) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(targetMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const displayModeRef = useRef(displayMode);
  const transitionCountRef = useRef(0);
  const modeTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const activeFinishRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    displayModeRef.current = displayMode;
  }, [displayMode]);

  const startTransition = useCallback(() => {
    transitionCountRef.current += 1;
    if (transitionCountRef.current === 1) {
      setIsTransitioning(true);
    }
    let finished = false;
    return () => {
      if (finished) return;
      finished = true;
      transitionCountRef.current = Math.max(0, transitionCountRef.current - 1);
      if (transitionCountRef.current === 0) {
        setIsTransitioning(false);
      }
    };
  }, []);

  const clearActiveTransition = useCallback(() => {
    if (modeTimerRef.current) window.clearTimeout(modeTimerRef.current);
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (activeFinishRef.current) {
      activeFinishRef.current();
      activeFinishRef.current = null;
    }
    modeTimerRef.current = null;
    transitionTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (displayModeRef.current === targetMode) {
      clearActiveTransition();
      return;
    }

    clearActiveTransition();

    const finish = startTransition();
    activeFinishRef.current = finish;
    modeTimerRef.current = window.setTimeout(() => {
      setDisplayMode(targetMode);
    }, modeSwitchMs);
    transitionTimerRef.current = window.setTimeout(() => {
      finish();
      activeFinishRef.current = null;
    }, modeFadeMs);

    return () => clearActiveTransition();
  }, [targetMode, modeSwitchMs, modeFadeMs, startTransition, clearActiveTransition]);

  useEffect(() => {
    if (!primarySymbol) return;
    const finish = startTransition();
    const timer = window.setTimeout(finish, symbolFlashMs);
    return () => {
      window.clearTimeout(timer);
      finish();
    };
  }, [primarySymbol, symbolFlashMs, startTransition]);

  return { displayMode, isTransitioning };
}
