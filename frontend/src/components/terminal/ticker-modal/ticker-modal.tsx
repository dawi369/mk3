"use client";

import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import {
  useTickerModal,
} from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { TradingChart } from "@/components/terminal/ticker-modal/trading-chart";
import { AISidebar } from "@/components/terminal/ticker-modal/ai-sidebar";
import { ModalHeader } from "@/components/terminal/ticker-modal/modal-header";
import { ChartToolbar } from "@/components/terminal/ticker-modal/chart-toolbar";
import { SymbolChips } from "@/components/terminal/ticker-modal/symbol-chips";
import { SpreadControls } from "@/components/terminal/ticker-modal/spread-controls";
import { useTickerStore } from "@/store/use-ticker-store";
import { useSpotlight } from "@/components/terminal/layout/spotlight/spotlight-provider";
import { useChartSeries } from "@/hooks/use-chart-series";
import { useChartSettings } from "@/hooks/use-chart-settings";
import type { SpreadPresetId } from "@/lib/chart-utils";

export function TickerModal() {
  const {
    isOpen,
    primarySymbol,
    close,
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    comparisons,
    timeframe,
    setTimeframe,
    showSessionLevels,
    toggleShowSessionLevels,
    spreadEnabled,
    setSpreadEnabled,
    spreadLegs,
    toggleSpreadLegSign,
    moveSpreadLeg,
    reverseSpreadLegs,
    applySpreadPreset,
    removeComparison,
    reorderSelection,
  } = useTickerModal();
  const { openWithMode } = useSpotlight();
  const mode = useTickerStore((state) => state.mode);
  const setTrackedSymbols = useTickerStore((state) => state.setTrackedSymbols);

  // ── Settings (localStorage, range, timeframe) ──────────────────────────

  const settings = useChartSettings({
    timeframe,
    setTimeframe,
    spreadEnabled,
    setSpreadEnabled,
    showSessionLevels,
    isSidebarOpen,
    setSidebarOpen,
  });

  // ── Display mode transitions ───────────────────────────────────────────

  const compareMode = !spreadEnabled && comparisons.length > 0;
  const targetMode: "single" | "compare" | "spread" = spreadEnabled
    ? "spread"
    : compareMode
      ? "compare"
      : "single";

  const initialMode: "single" | "compare" | "spread" = targetMode;
  const [displayMode, setDisplayMode] = useState<"single" | "compare" | "spread">(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionRef = useRef<number | null>(null);
  const transitionCountRef = useRef(0);

  const beginTransition = useCallback((duration: number) => {
    transitionCountRef.current += 1;
    setIsTransitioning(true);
    const handle = window.setTimeout(() => {
      transitionCountRef.current = Math.max(0, transitionCountRef.current - 1);
      if (transitionCountRef.current === 0) {
        setIsTransitioning(false);
      }
    }, duration);
    return handle;
  }, []);

  useEffect(() => {
    if (displayMode === targetMode) return;
    if (transitionRef.current) {
      window.clearTimeout(transitionRef.current);
    }

    const transitionHandle = beginTransition(260);
    transitionRef.current = window.setTimeout(() => {
      setDisplayMode(targetMode);
    }, 120);

    return () => {
      if (transitionRef.current) {
        window.clearTimeout(transitionRef.current);
      }
      window.clearTimeout(transitionHandle);
    };
  }, [displayMode, targetMode, beginTransition]);

  useEffect(() => {
    if (!primarySymbol) return;
    const handle = beginTransition(160);
    return () => {
      window.clearTimeout(handle);
    };
  }, [primarySymbol, beginTransition]);

  const displayCompare = displayMode === "compare";
  const displaySpread = displayMode === "spread";

  // ── Data pipeline ──────────────────────────────────────────────────────

  const series = useChartSeries({
    primarySymbol,
    comparisons,
    spreadEnabled,
    spreadLegs,
    timeframe,
    isOpen,
    mode,
    rangeOverride: settings.rangeOverride,
    displayCompare,
    displaySpread,
    showLegs: settings.showLegs,
    showSessionLevels,
  });

  // ── Ordered symbols (for chips/spread) ─────────────────────────────────

  const orderedSymbols = useMemo(() => {
    if (!primarySymbol) return comparisons;
    return [primarySymbol, ...comparisons];
  }, [primarySymbol, comparisons]);

  // ── Track symbols for live updates ─────────────────────────────────────

  const headerSymbols = useMemo(() => {
    if (spreadEnabled && spreadLegs.length > 0) {
      return spreadLegs.map((leg) => leg.symbol);
    }
    return orderedSymbols;
  }, [orderedSymbols, spreadEnabled, spreadLegs]);

  useEffect(() => {
    if (!isOpen) {
      setTrackedSymbols([]);
      return;
    }
    setTrackedSymbols(headerSymbols);
  }, [isOpen, headerSymbols, setTrackedSymbols]);

  // ── Drawer animation ────────────────────────────────────────────────────
  // Decouple from store to let vaul animate before unmounting.
  // `drawerOpen` controls vaul's `open` prop. When dismissing, we set
  // it to false first (vaul slides down), then call the real close()
  // only after the animation finishes via onAnimationEnd.

  const [drawerOpen, setDrawerOpen] = useState(isOpen);
  const closingRef = useRef(false);

  // Sync open: when store opens the modal, open the drawer
  useEffect(() => {
    if (isOpen) {
      setDrawerOpen(true);
      closingRef.current = false;
    }
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setDrawerOpen(false); // triggers vaul's close animation
  }, []);

  const handleAnimationEnd = useCallback(
    (open: boolean) => {
      if (!open && closingRef.current) {
        close(); // now safe to unmount — animation is done
        closingRef.current = false;
      }
    },
    [close],
  );

  // ── Escape key ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  if (!primarySymbol) return null;

  return (
    <Drawer open={drawerOpen} onOpenChange={(open) => !open && handleDismiss()} onAnimationEnd={handleAnimationEnd}>
      <DrawerContent className="h-[94vh] max-h-none! rounded-t-2xl [&>div.bg-muted]:hidden" data-vaul-no-drag>
        {/* Accessibility: Hidden title and description for screen readers */}
        <DrawerTitle asChild>
           <VisuallyHidden.Root>{primarySymbol} Details</VisuallyHidden.Root>
        </DrawerTitle>
        <DrawerDescription asChild>
           <VisuallyHidden.Root>Trading view for {primarySymbol}</VisuallyHidden.Root>
        </DrawerDescription>

        {/* Header */}
        <div className="px-4 pt-3 pb-2 bg-black/20 border-b border-white/10">
            <ModalHeader
              headerItems={series.headerItems}
              onClose={handleDismiss}
            />

          <div className="mt-3 flex flex-col gap-2">
            <ChartToolbar
              timeframe={timeframe}
              onTimeframeChange={settings.handleTimeframeChange}
              rangePreset={settings.rangePreset}
              onRangePresetChange={settings.handleRangePresetChange}
              showSessionLevels={showSessionLevels}
              onToggleSessionLevels={toggleShowSessionLevels}
              displayCompare={displayCompare}
              onAddSymbol={() => openWithMode("ticker-compare")}
            />

            <SymbolChips
              orderedSymbols={orderedSymbols}
              spreadEnabled={spreadEnabled}
              onSetSpreadEnabled={setSpreadEnabled}
              onRemoveComparison={removeComparison}
              onReorderSelection={reorderSelection}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={toggleSidebar}
            />

            {spreadEnabled && (
              <SpreadControls
                spreadLegs={spreadLegs}
                primarySymbol={primarySymbol}
                orderedSymbols={orderedSymbols}
                showLegs={settings.showLegs}
                onSetShowLegs={settings.setShowLegs}
                onToggleSign={toggleSpreadLegSign}
                onMoveLeg={moveSpreadLeg}
                onRemove={removeComparison}
                onReverse={reverseSpreadLegs}
                onApplyPreset={(id: SpreadPresetId) => applySpreadPreset(id)}
              />
            )}
          </div>
        </div>

        {/* Main content area with chart and sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chart area */}
          <div className="flex-1 p-3 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-xl border border-white/10 bg-black/20 overflow-hidden transition-opacity duration-200",
                isTransitioning && "opacity-70"
              )}
            >
              <TradingChart
                ticker={primarySymbol}
                data={displaySpread || displayCompare ? undefined : series.chartData}
                lineData={
                  displaySpread
                    ? series.spreadData
                    : displayCompare
                      ? series.primaryLineData
                      : undefined
                }
                comparisons={series.overlaySymbols}
                comparisonData={series.comparisonData}
                showComparisons={displaySpread ? settings.showLegs : displayCompare}
                fitKey={series.fitKey}
                visibleBars={series.visibleBars}
                secondsVisible={series.secondsVisible}
                sessionLevels={series.sessionLevels}
                compareMode={displayCompare}
              />
            </div>
          </div>

          {/* AI Sidebar */}
          <AISidebar isOpen={isSidebarOpen} />
        </div>

      </DrawerContent>
    </Drawer>
  );
}
