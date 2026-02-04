"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SYMBOL_COLORS,
  useTickerModal,
} from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { TradingChart } from "@/components/terminal/ticker-modal/trading-chart";
import { AISidebar } from "@/components/terminal/ticker-modal/ai-sidebar";
import { useTickerStore } from "@/store/use-ticker-store";
import { buildTickerSnapshot } from "@/lib/ticker-snapshot";
import { resampleBars } from "@/lib/bar-resample";
import { useSpotlight } from "@/components/terminal/layout/spotlight/spotlight-provider";
import {
  MAX_SPREAD_LEGS,
  TIMEFRAMES,
  type SpreadLeg,
  type Timeframe,
} from "@/types/ticker.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Bar } from "@/types/common.types";
import type { CandlestickData, LineData, Time } from "lightweight-charts";

type SpreadPresetId = "calendar" | "ratio" | "butterfly" | "condor";

const SPREAD_PRESETS: Array<{ id: SpreadPresetId; label: string; weights: number[] }> = [
  { id: "calendar", label: "Calendar (1:-1)", weights: [1, -1] },
  { id: "ratio", label: "Ratio (1:-1)", weights: [1, -1] },
  { id: "butterfly", label: "Butterfly (1:-2:1)", weights: [1, -2, 1] },
  { id: "condor", label: "Condor (1:-1:-1:1)", weights: [1, -1, -1, 1] },
];

const formatNumber = (num: number, decimals = 2) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

function toCandleData(bars: Bar[]): CandlestickData<Time>[] {
  return bars.map((bar) => ({
    time: Math.floor(bar.startTime / 1000) as Time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  }));
}

function toLineData(bars: Bar[]): LineData<Time>[] {
  return bars.map((bar) => ({
    time: Math.floor(bar.startTime / 1000) as Time,
    value: bar.close,
  }));
}

function buildSpreadSeries(
  legs: SpreadLeg[],
  seriesBySymbol: Record<string, Bar[]>,
  timeframe: Timeframe
): LineData<Time>[] {
  if (!legs || legs.length === 0) return [];

  const legMaps = legs.map((leg) => {
    const bars = seriesBySymbol[leg.symbol];
    if (!bars || bars.length === 0) return { leg, map: new Map<number, number>() };
    const resampled = resampleBars(bars, timeframe);
    const map = new Map<number, number>();
    for (const bar of resampled) {
      map.set(bar.startTime, bar.close);
    }
    return { leg, map };
  });

  const base = legMaps[0];
  const data: LineData<Time>[] = [];

  for (const [time, baseValue] of base.map) {
    let sum = baseValue * base.leg.weight;
    let valid = true;

    for (let i = 1; i < legMaps.length; i++) {
      const nextValue = legMaps[i].map.get(time);
      if (nextValue === undefined) {
        valid = false;
        break;
      }
      sum += nextValue * legMaps[i].leg.weight;
    }

    if (valid) {
      data.push({
        time: Math.floor(time / 1000) as Time,
        value: sum,
      });
    }
  }

  return data;
}

export function TickerModal() {
  const {
    isOpen,
    primarySymbol,
    close,
    isSidebarOpen,
    toggleSidebar,
    comparisons,
    timeframe,
    setTimeframe,
    spreadEnabled,
    setSpreadEnabled,
    spreadLegs,
    toggleSpreadLegSign,
    moveSpreadLeg,
    reverseSpreadLegs,
    applySpreadPreset,
    removeComparison,
  } = useTickerModal();
  const { openWithMode } = useSpotlight();
  const mode = useTickerStore((state) => state.mode);
  const seriesBySymbol = useTickerStore((state) => state.seriesByMode[mode]);
  const entity = useTickerStore((state) =>
    primarySymbol ? state.entitiesByMode[mode][primarySymbol] : undefined
  );
  const bars = useTickerStore((state) =>
    primarySymbol ? state.seriesByMode[mode][primarySymbol] : undefined
  );
  const [showLegs, setShowLegs] = useState(true);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  if (!primarySymbol) return null;

  const snapshot = useMemo(
    () => buildTickerSnapshot(primarySymbol, bars, entity?.latestBar),
    [primarySymbol, bars, entity?.latestBar]
  );
  const changePercent = snapshot.prev_close
    ? ((snapshot.last_price - snapshot.prev_close) / snapshot.prev_close) * 100
    : 0;
  const resampledPrimary = useMemo(
    () => (bars && bars.length > 0 ? resampleBars(bars, timeframe) : []),
    [bars, timeframe]
  );

  const chartData: CandlestickData<Time>[] | undefined = useMemo(() => {
    if (resampledPrimary.length === 0) return undefined;
    return toCandleData(resampledPrimary);
  }, [resampledPrimary]);

  const orderedSymbols = useMemo(() => {
    if (!primarySymbol) return comparisons;
    return [primarySymbol, ...comparisons];
  }, [primarySymbol, comparisons]);

  const headerTitle = useMemo(() => {
    if (spreadEnabled) {
      if (spreadLegs.length === 0) return primarySymbol;
      return `Spread (${spreadLegs.length} legs)`;
    }

    if (orderedSymbols.length <= 1) return primarySymbol;
    if (orderedSymbols.length === 2) {
      return `${orderedSymbols[0]} + ${orderedSymbols[1]}`;
    }
    return `${orderedSymbols[0]} + ${orderedSymbols[1]} + ${orderedSymbols.length - 2}`;
  }, [orderedSymbols, primarySymbol, spreadEnabled, spreadLegs]);

  const overlaySymbols = spreadEnabled
    ? showLegs
      ? spreadLegs.map((leg) => leg.symbol)
      : []
    : comparisons;

  const comparisonData = useMemo(() => {
    const data: Record<string, LineData<Time>[]> = {};
    const symbols = new Set(overlaySymbols);
    for (const symbol of symbols) {
      const series = seriesBySymbol[symbol];
      if (!series || series.length === 0) {
        data[symbol] = [];
        continue;
      }
      const resampled = resampleBars(series, timeframe);
      data[symbol] = resampled.length > 0 ? toLineData(resampled) : [];
    }
    return data;
  }, [overlaySymbols, seriesBySymbol, timeframe]);

  const spreadData = useMemo(() => {
    if (!spreadEnabled) return [];
    return buildSpreadSeries(spreadLegs, seriesBySymbol, timeframe);
  }, [spreadEnabled, spreadLegs, seriesBySymbol, timeframe]);

  const fitKey = `${primarySymbol}:${timeframe}:${spreadEnabled ? "spread" : "compare"}`;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && close()} handleOnly>
      <DrawerContent className="h-[94vh] max-h-none! rounded-t-2xl [&>div.bg-muted]:hidden">
        {/* Accessibility: Hidden title and description for screen readers */}
        <DrawerTitle asChild>
           <VisuallyHidden.Root>{primarySymbol} Details</VisuallyHidden.Root>
        </DrawerTitle>
        <DrawerDescription asChild>
           <VisuallyHidden.Root>Trading view for {primarySymbol}</VisuallyHidden.Root>
        </DrawerDescription>

        {/* Header */}
        <div className="px-4 pt-3 pb-2 bg-black/20 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-bold tracking-tight">{headerTitle}</h2>
              <div className="flex items-center gap-2">
                <span className="text-base font-mono">{formatNumber(snapshot.last_price)}</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    changePercent >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {changePercent >= 0 ? "+" : ""}
                  {changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={close}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => openWithMode("ticker-compare")}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Symbol</span>
                  <kbd className="hidden md:inline-flex ml-1 px-1 py-0.5 rounded bg-white/10 text-[10px] font-mono">
                    Ctrl+K
                  </kbd>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                      {timeframe}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[80px]">
                    <DropdownMenuLabel className="text-xs">Timeframe</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {TIMEFRAMES.map((tf, index) => (
                      <DropdownMenuItem
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={cn("text-xs", timeframe === tf && "bg-accent")}
                      >
                        <span className="flex-1">{tf}</span>
                        <kbd className="text-[10px] text-muted-foreground">{index + 1}</kbd>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                      Indicators
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[140px]">
                    <DropdownMenuLabel className="text-xs">Indicators</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Coming soon...
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
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

                {!spreadEnabled && (
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {orderedSymbols.map((symbol, index) => (
                      <div
                        key={symbol}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                          "bg-white/5 hover:bg-white/10 transition-colors"
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: SYMBOL_COLORS[index % SYMBOL_COLORS.length] }}
                        />
                        <span className="font-mono">{symbol}</span>
                        {orderedSymbols.length > 1 && (
                          <button
                            onClick={() => removeComparison(symbol)}
                            className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

            {spreadEnabled && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-2">
                  {spreadLegs.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Select up to {MAX_SPREAD_LEGS} symbols to build a spread.
                    </span>
                  )}
                  {spreadLegs.map((leg, index) => (
                    <div
                      key={leg.symbol}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                        "bg-white/5 hover:bg-white/10 transition-colors"
                      )}
                    >
                      <button
                        onClick={() => toggleSpreadLegSign(leg.symbol)}
                        className={cn(
                          "px-1 rounded font-mono text-[10px]",
                          leg.weight >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {leg.weight > 0 ? "+" : ""}{leg.weight}
                      </button>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: SYMBOL_COLORS[(index + 1) % SYMBOL_COLORS.length] }}
                      />
                      <span className="font-mono">{leg.symbol}</span>
                      <div className="flex items-center gap-0.5 ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => moveSpreadLeg(leg.symbol, -1)}
                          disabled={index === 0}
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => moveSpreadLeg(leg.symbol, 1)}
                          disabled={index === spreadLegs.length - 1}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                        {leg.symbol !== primarySymbol && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => removeComparison(leg.symbol)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                        Presets
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[180px]">
                      <DropdownMenuLabel className="text-xs">Popular Spreads</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {SPREAD_PRESETS.map((preset) => {
                        const disabled = orderedSymbols.length < preset.weights.length;
                        return (
                          <DropdownMenuItem
                            key={preset.id}
                            disabled={disabled}
                            className="text-xs"
                            onClick={() => applySpreadPreset(preset.id)}
                          >
                            {preset.label}
                            {disabled && (
                              <span className="ml-auto text-[10px] text-muted-foreground">
                                Need {preset.weights.length}
                              </span>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={reverseSpreadLegs}
                    disabled={spreadLegs.length === 0}
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    Reverse
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setShowLegs((prev) => !prev)}
                    disabled={spreadLegs.length === 0}
                    aria-label={showLegs ? "Hide leg overlays" : "Show leg overlays"}
                  >
                    {showLegs ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content area with chart and sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chart area */}
          <div className="flex-1 p-3 overflow-hidden">
            <div className="h-full rounded-xl border border-white/10 bg-black/20 overflow-hidden">
              <TradingChart
                ticker={primarySymbol}
                data={spreadEnabled ? undefined : chartData}
                lineData={spreadEnabled ? spreadData : undefined}
                comparisons={overlaySymbols}
                comparisonData={comparisonData}
                showComparisons={!spreadEnabled || showLegs}
                fitKey={fitKey}
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
