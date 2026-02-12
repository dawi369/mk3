"use client";

import React, { useEffect, useMemo, useCallback, useRef, useId } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTickerModal,
} from "@/components/terminal/ticker-modal/ticker-modal-provider";
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
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const MODE_SWITCH_MS = 120;
const MODE_FADE_MS = 260;
const SYMBOL_FLASH_MS = 160;

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
  // Let Vaul control its own state. We use isOpen from store as the single
  // source of truth and let vaul handle all animations internally.
  // Step 2: Detach onOpenChange to prevent controlled/uncontrolled feedback loop.

  const handleCloseClick = useCallback(() => {
    if (!isOpen) return;
    close();
  }, [close, isOpen]);

  // ── Escape key ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const titleId = useId();
  const descriptionId = useId();

  // Step 1: Gate rendering with both isOpen && primarySymbol.
  // Only render Drawer when both are truthy to avoid mounting in unstable state.
  if (!isOpen || !primarySymbol) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50"
        onClick={handleCloseClick}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="absolute inset-x-0 bottom-0 z-50 flex h-[94vh] max-h-none flex-col rounded-t-2xl border-t border-white/10 bg-background"
      >
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden.Root id={titleId}>{primarySymbol} Details</VisuallyHidden.Root>
        <VisuallyHidden.Root id={descriptionId}>Trading view for {primarySymbol}</VisuallyHidden.Root>

        {/* Header */}
        <div className="px-4 pt-3 pb-2 bg-black/20 border-b border-white/10">
            <ModalHeader
              headerItems={series.headerItems}
              onClose={handleCloseClick}
            />

          <div className="mt-3 flex flex-col gap-2">
            {/* Row 1: Main toolbar + Compare/Spread toggle */}
            <div className="flex items-center justify-between gap-3">
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

              <div className="flex items-center gap-2">
                {/* Compare/Spread toggle */}
                <ToggleGroup
                  type="single"
                  value={spreadEnabled ? "spread" : "compare"}
                  onValueChange={(val) => {
                    if (!val) return;
                    setSpreadEnabled(val === "spread");
                  }}
                  className="bg-muted/50 p-0.5 rounded-md border border-white/5"
                >
                  <ToggleGroupItem value="compare" size="sm" className="h-7 px-2 text-xs data-[state=on]:bg-background">
                    Compare
                  </ToggleGroupItem>
                  <ToggleGroupItem value="spread" size="sm" className="h-7 px-2 text-xs data-[state=on]:bg-background">
                    Spread
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Sidebar toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={toggleSidebar}
                  aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {isSidebarOpen ? (
                    <PanelRightClose className="w-3.5 h-3.5" />
                ) : (
                  <PanelRightOpen className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Row 2: Pills/controls */}
          <div className="flex items-center justify-between gap-3">
            {spreadEnabled ? (
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
            ) : (
              <SymbolChips
                orderedSymbols={orderedSymbols}
                onRemoveComparison={removeComparison}
                onReorderSelection={reorderSelection}
              />
            )}
          </div>
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

      </div>
    </div>
  );
}
