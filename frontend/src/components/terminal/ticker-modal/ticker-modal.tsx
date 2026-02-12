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
import { useDisplayModeTransition } from "@/components/terminal/ticker-modal/use-display-mode-transition";

const MODE_SWITCH_MS = 120;
const MODE_FADE_MS = 260;
const SYMBOL_FLASH_MS = 160;
const DRAWER_CLOSE_MS = 260;

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

  const { displayMode, isTransitioning } = useDisplayModeTransition({
    targetMode,
    primarySymbol,
    modeSwitchMs: MODE_SWITCH_MS,
    modeFadeMs: MODE_FADE_MS,
    symbolFlashMs: SYMBOL_FLASH_MS,
  });

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

  const headerSymbolsKey = useMemo(() => headerSymbols.join("|"), [headerSymbols]);
  const trackedSymbolsKeyRef = useRef("");

  useEffect(() => {
    if (!isOpen) {
      if (trackedSymbolsKeyRef.current !== "") {
        trackedSymbolsKeyRef.current = "";
        setTrackedSymbols([]);
      }
      return;
    }
    if (trackedSymbolsKeyRef.current === headerSymbolsKey) return;
    trackedSymbolsKeyRef.current = headerSymbolsKey;
    setTrackedSymbols(headerSymbols);
  }, [isOpen, headerSymbols, headerSymbolsKey, setTrackedSymbols]);

  // ── Drawer animation ────────────────────────────────────────────────────
  // Decouple from store to let vaul animate before unmounting.
  // `drawerOpen` controls vaul's `open` prop. When dismissing, we set
  // it to false first (vaul slides down), then call the real close()
  // after the animation duration.

  const [drawerOpen, setDrawerOpen] = useState(isOpen);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // Sync open: when store opens the modal, open the drawer
  useEffect(() => {
    if (isOpen) {
      if (!closingRef.current) {
        clearCloseTimer();
        setDrawerOpen(true);
      }
      return;
    }
    closingRef.current = false;
    clearCloseTimer();
    setDrawerOpen(false);
  }, [isOpen, clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const handleDismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setDrawerOpen(false); // triggers vaul's close animation
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      close();
      closingRef.current = false;
      closeTimerRef.current = null;
    }, DRAWER_CLOSE_MS);
  }, [close, clearCloseTimer]);

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
    <Drawer open={drawerOpen} onOpenChange={(open) => !open && handleDismiss()}>
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
