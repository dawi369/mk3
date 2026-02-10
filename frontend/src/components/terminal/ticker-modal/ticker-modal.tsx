"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { useChartHistory } from "@/hooks/use-chart-history";
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

  const TIMEFRAME_MS: Record<Timeframe, number> = {
    "15s": 15000,
    "30s": 30000,
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "1h": 3600000,
    "4h": 14400000,
    "1d": 86400000,
  };

function normalizeTimestamp(value: number): number {
  if (!Number.isFinite(value)) return value;
  return value < 1e12 ? value * 1000 : value;
}

function inferIntervalMs(bars: Bar[]): number | null {
  if (!bars || bars.length < 2) return null;
  const slice = bars.length > 60 ? bars.slice(-60) : bars;
  const times = slice
    .map((bar) => normalizeTimestamp(bar.startTime))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (times.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const diff = times[i] - times[i - 1];
    if (diff > 0) diffs.push(diff);
  }

  if (diffs.length === 0) return null;
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)] ?? null;
}

function mergeLatestIntoSeries(series: Bar[], latest: Bar | undefined, bucketMs: number): Bar[] {
  if (!latest) return series;
  const normalizedStart = normalizeTimestamp(latest.startTime);
  if (!Number.isFinite(normalizedStart)) return series;
  const bucketStart = Math.floor(normalizedStart / bucketMs) * bucketMs;
  const bucketEnd = bucketStart + bucketMs;
  const existing = series.length > 0 ? [...series] : [];
  const last = existing[existing.length - 1];
  if (!last) {
    existing.push({
      ...latest,
      startTime: bucketStart,
      endTime: bucketEnd,
    });
    return existing;
  }

  const lastStart = normalizeTimestamp(last.startTime);
  if (lastStart === bucketStart) {
    if (
      last.close === latest.close &&
      last.high >= latest.high &&
      last.low <= latest.low
    ) {
      return existing;
    }
    existing[existing.length - 1] = {
      ...last,
      high: Math.max(last.high, latest.high),
      low: Math.min(last.low, latest.low),
      close: latest.close,
      volume: (last.volume || 0) + (latest.volume || 0),
      trades: (last.trades || 0) + (latest.trades || 0),
      endTime: bucketEnd,
    };
    return existing;
  }

  if (bucketStart > lastStart) {
    existing.push({
      ...latest,
      startTime: bucketStart,
      endTime: bucketEnd,
    });
  }

  return existing;
}

function formatDepth(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

function toCandleData(bars: Bar[]): CandlestickData<Time>[] {
  return bars.map((bar) => ({
    time: Math.floor(normalizeTimestamp(bar.startTime) / 1000) as Time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  }));
}

function toLineData(bars: Bar[]): LineData<Time>[] {
  return bars.map((bar) => ({
    time: Math.floor(normalizeTimestamp(bar.startTime) / 1000) as Time,
    value: bar.close,
  }));
}


function buildSpreadSeries(
  legs: SpreadLeg[],
  seriesBySymbol: Record<string, Bar[]>
): LineData<Time>[] {
  if (!legs || legs.length === 0) return [];

  const legMaps = legs.map((leg) => {
    const bars = seriesBySymbol[leg.symbol];
    if (!bars || bars.length === 0) return { leg, map: new Map<number, number>() };
    const map = new Map<number, number>();
    for (const bar of bars) {
      map.set(normalizeTimestamp(bar.startTime), bar.close);
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

function reorderSymbols(order: string[], from: string, to: string): string[] {
  if (from === to) return order;
  if (!order.includes(from)) return order;
  const next = order.filter((symbol) => symbol !== from);
  const targetIndex = next.indexOf(to);
  if (targetIndex === -1) {
    next.push(from);
    return next;
  }
  next.splice(targetIndex, 0, from);
  return next;
}

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
  const liveSeriesBySymbol = useTickerStore((state) => state.seriesByMode[mode]);
  const entities = useTickerStore((state) => state.entitiesByMode[mode]);
  const snapshots = useTickerStore((state) => state.snapshotsBySymbol);
  const sessions = useTickerStore((state) => state.sessionsBySymbol);
  const setTrackedSymbols = useTickerStore((state) => state.setTrackedSymbols);
  const [showLegs, setShowLegs] = useState(true);
  const setShowSessionLevels = useTickerStore((state) => state.setShowSessionLevels);
  const [dragSymbol, setDragSymbol] = useState<string | null>(null);
  const [dragOverSymbol, setDragOverSymbol] = useState<string | null>(null);
  const dragSymbolRef = useRef<string | null>(null);
  const orderedSymbols = useMemo(() => {
    if (!primarySymbol) return comparisons;
    return [primarySymbol, ...comparisons];
  }, [primarySymbol, comparisons]);
  const compareMode = !spreadEnabled && comparisons.length > 0;
  const initialMode: "single" | "compare" | "spread" = spreadEnabled
    ? "spread"
    : compareMode
      ? "compare"
      : "single";
  const [displayMode, setDisplayMode] = useState<"single" | "compare" | "spread">(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionRef = useRef<number | null>(null);
  const transitionCountRef = useRef(0);
  const latestSignatureRef = useRef<Map<string, string>>(new Map());
  const mergedHistoryRef = useRef<Map<string, { key: string; series: Bar[] }>>(new Map());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const targetMode: "single" | "compare" | "spread" = spreadEnabled
    ? "spread"
    : compareMode
      ? "compare"
      : "single";

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

  useEffect(() => {
    const storedTimeframe = localStorage.getItem("terminal-chart-timeframe");
    if (storedTimeframe && TIMEFRAMES.includes(storedTimeframe as Timeframe)) {
      setTimeframe(storedTimeframe as Timeframe);
    }

    const storedSpread = localStorage.getItem("terminal-chart-spread-enabled");
    if (storedSpread === "true" || storedSpread === "false") {
      setSpreadEnabled(storedSpread === "true");
    }

    const storedShowLegs = localStorage.getItem("terminal-chart-show-legs");
    if (storedShowLegs === "true" || storedShowLegs === "false") {
      setShowLegs(storedShowLegs === "true");
    }

    const storedSidebar = localStorage.getItem("terminal-chart-sidebar-open");
    if (storedSidebar === "true" || storedSidebar === "false") {
      setSidebarOpen(storedSidebar === "true");
    }

    setSettingsLoaded(true);
  }, [setTimeframe, setSpreadEnabled, setShowLegs, setSidebarOpen]);

  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem("terminal-show-session-levels", String(showSessionLevels));
  }, [showSessionLevels, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem("terminal-chart-timeframe", timeframe);
  }, [timeframe, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem("terminal-chart-spread-enabled", String(spreadEnabled));
  }, [spreadEnabled, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem("terminal-chart-show-legs", String(showLegs));
  }, [showLegs, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem("terminal-chart-sidebar-open", String(isSidebarOpen));
  }, [isSidebarOpen, settingsLoaded]);


  const headerSymbols = useMemo(() => {
    if (spreadEnabled && spreadLegs.length > 0) {
      return spreadLegs.map((leg) => leg.symbol);
    }
    return orderedSymbols;
  }, [orderedSymbols, spreadEnabled, spreadLegs]);

  const chartSymbols = useMemo(() => {
    const symbols = new Set<string>();
    if (primarySymbol) symbols.add(primarySymbol);
    for (const symbol of comparisons) symbols.add(symbol);
    if (spreadEnabled) {
      for (const leg of spreadLegs) symbols.add(leg.symbol);
    }
    return Array.from(symbols);
  }, [primarySymbol, comparisons, spreadEnabled, spreadLegs]);

  const { seriesBySymbol: historySeriesBySymbol } = useChartHistory({
    symbols: chartSymbols,
    timeframe,
    enabled: isOpen,
    mode,
  });

  const resolvedSeriesBySymbol = useMemo(() => {
    const map: Record<string, Bar[]> = {};
    for (const symbol of chartSymbols) {
      const history = historySeriesBySymbol[symbol];
      map[symbol] = history && history.length > 0 ? history : liveSeriesBySymbol[symbol] ?? [];
    }
    return map;
  }, [chartSymbols, historySeriesBySymbol, liveSeriesBySymbol]);

  const chartSeriesBySymbol = useMemo(() => {
    const map: Record<string, Bar[]> = {};
    for (const symbol of chartSymbols) {
      const history = historySeriesBySymbol[symbol];
      if (history && history.length > 0) {
        const targetMs = TIMEFRAME_MS[timeframe];
        const latest = entities[symbol]?.latestBar;
        if (!latest) {
          map[symbol] = history;
          continue;
        }

        const signature = `${latest.startTime}:${latest.high}:${latest.low}:${latest.close}:${latest.volume}:${latest.trades}`;
        const historyTail = history[history.length - 1];
        const historyKey = `${history.length}:${historyTail?.startTime ?? 0}:${historyTail?.close ?? 0}`;
        const cacheKey = `${historyKey}:${targetMs}`;
        const cached = mergedHistoryRef.current.get(symbol);
        const lastSignature = latestSignatureRef.current.get(symbol);

        if (cached && cached.key === cacheKey && lastSignature === signature) {
          map[symbol] = cached.series;
          continue;
        }

        const baseSeries = cached && cached.key === cacheKey ? cached.series : history;
        const merged = mergeLatestIntoSeries(baseSeries, latest, targetMs);
        latestSignatureRef.current.set(symbol, signature);
        mergedHistoryRef.current.set(symbol, { key: cacheKey, series: merged });
        map[symbol] = merged;
        continue;
      }

      const live = liveSeriesBySymbol[symbol] ?? [];
      if (live.length === 0) {
        map[symbol] = [];
        continue;
      }

      const targetMs = TIMEFRAME_MS[timeframe];
      const inferredMs = inferIntervalMs(live);
      const needsResample = inferredMs !== null && Math.abs(inferredMs - targetMs) > targetMs * 0.2;
      map[symbol] = needsResample ? resampleBars(live, timeframe) : live;
    }
    return map;
  }, [chartSymbols, historySeriesBySymbol, liveSeriesBySymbol, timeframe, entities]);

  const bars = primarySymbol ? chartSeriesBySymbol[primarySymbol] : undefined;

  const primaryLineData = useMemo(() => {
    if (!bars || bars.length === 0) return [];
    return toLineData(bars);
  }, [bars]);


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

  const depthInfo = useMemo(() => {
    if (!bars || bars.length === 0) return null;
    const first = normalizeTimestamp(bars[0].startTime);
    const last = normalizeTimestamp(bars[bars.length - 1].startTime);
    const unit = bars[bars.length - 1].startTime < 1e12 ? "s" : "ms";
    return {
      first,
      last,
      unit,
      depth: formatDepth(last - first),
      count: bars.length,
    };
  }, [bars]);

  const chartData: CandlestickData<Time>[] | undefined = useMemo(() => {
    if (!bars || bars.length === 0 || displayCompare || displaySpread) return undefined;
    return toCandleData(bars);
  }, [bars, displayCompare, displaySpread]);

  const primarySnapshot = useMemo(() => {
    if (!primarySymbol) return null;
    const symbolBars = resolvedSeriesBySymbol[primarySymbol];
    const symbolEntity = entities[primarySymbol];
    return buildTickerSnapshot(
      primarySymbol,
      symbolBars,
      symbolEntity?.latestBar,
      snapshots[primarySymbol],
      sessions[primarySymbol]
    );
  }, [primarySymbol, resolvedSeriesBySymbol, entities, snapshots, sessions]);

  const sessionLevels = useMemo(() => {
    if (!showSessionLevels || !primarySnapshot || displaySpread || displayCompare) return undefined;
    return {
      high: primarySnapshot.session_high,
      low: primarySnapshot.session_low,
      last: primarySnapshot.last_price,
    };
  }, [showSessionLevels, primarySnapshot, displaySpread, displayCompare]);

  const headerItems = useMemo(() => {
    return headerSymbols.map((symbol) => {
      const symbolBars = resolvedSeriesBySymbol[symbol];
      const symbolEntity = entities[symbol];
      const symbolSnapshot = buildTickerSnapshot(
        symbol,
        symbolBars,
        symbolEntity?.latestBar,
        snapshots[symbol],
        sessions[symbol]
      );
      const symbolChange = symbolSnapshot.changePercent;

      return {
        symbol,
        price: symbolSnapshot.last_price,
          changePercent: symbolChange,
      };
    });
  }, [headerSymbols, resolvedSeriesBySymbol, entities, snapshots, sessions]);

  useEffect(() => {
    if (!isOpen) {
      setTrackedSymbols([]);
      return;
    }
    setTrackedSymbols(headerSymbols);
  }, [isOpen, headerSymbols, setTrackedSymbols]);

  const overlaySymbols = displaySpread
    ? showLegs
      ? spreadLegs.map((leg) => leg.symbol)
      : []
    : displayCompare
      ? comparisons
      : [];

  const comparisonData = useMemo(() => {
    const data: Record<string, LineData<Time>[]> = {};
    const symbols = new Set(overlaySymbols);
    for (const symbol of symbols) {
      const series = chartSeriesBySymbol[symbol];
      if (!series || series.length === 0) {
        data[symbol] = [];
        continue;
      }
      data[symbol] = toLineData(series);
    }
    return data;
  }, [overlaySymbols, chartSeriesBySymbol]);

  const spreadData = useMemo(() => {
    if (!spreadEnabled) return [];
    return buildSpreadSeries(spreadLegs, chartSeriesBySymbol);
  }, [spreadEnabled, spreadLegs, chartSeriesBySymbol]);

  const fitKey = `${primarySymbol ?? "none"}:${timeframe}:${displaySpread ? "spread" : displayCompare ? "compare" : "single"}`;
  const visibleBars = 200;
  const secondsVisible = timeframe.endsWith("s");

  if (!primarySymbol) return null;

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
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {headerItems.map((item, index) => (
                  <div key={item.symbol} className="flex items-baseline gap-2">
                  <span className="text-lg font-bold tracking-tight">{item.symbol}</span>
                  <span className="text-base font-mono">{formatNumber(item.price)}</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      item.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </span>
                  {index < headerItems.length - 1 && (
                    <span className="text-muted-foreground/60">,</span>
                  )}
                </div>
              ))}
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

          {depthInfo && (
            <div className="mt-2 text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
              <span>Depth {depthInfo.depth}</span>
              <span>·</span>
              <span>Bars {depthInfo.count.toLocaleString()}</span>
              <span>·</span>
              <span>Unit {depthInfo.unit}</span>
            </div>
          )}

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
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Coming soon...
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs gap-1",
                    showSessionLevels && "bg-white/10 text-foreground"
                  )}
                  onClick={toggleShowSessionLevels}
                >
                  Levels
                </Button>

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
                  <div
                    className="flex items-center gap-2 overflow-x-auto"
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (dragOverSymbol) setDragOverSymbol(null);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const source =
                        event.dataTransfer.getData("text/plain") || dragSymbolRef.current;
                      if (!source) return;
                      const nextOrder = reorderSymbols(orderedSymbols, source, "__end__");
                      reorderSelection(nextOrder);
                      dragSymbolRef.current = null;
                      setDragSymbol(null);
                      setDragOverSymbol(null);
                    }}
                  >
                    {orderedSymbols.map((symbol, index) => (
                      <div
                        key={symbol}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", symbol);
                          dragSymbolRef.current = symbol;
                          setDragSymbol(symbol);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (symbol !== dragSymbolRef.current) {
                            setDragOverSymbol(symbol);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverSymbol === symbol) setDragOverSymbol(null);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const source =
                            event.dataTransfer.getData("text/plain") || dragSymbolRef.current;
                          if (!source) return;
                          const nextOrder = reorderSymbols(orderedSymbols, source, symbol);
                          if (nextOrder.join("|") === orderedSymbols.join("|")) {
                            dragSymbolRef.current = null;
                            setDragSymbol(null);
                            setDragOverSymbol(null);
                            return;
                          }
                          reorderSelection(nextOrder);
                          dragSymbolRef.current = null;
                          setDragSymbol(null);
                          setDragOverSymbol(null);
                        }}
                        onDragEnd={() => {
                          dragSymbolRef.current = null;
                          setDragSymbol(null);
                          setDragOverSymbol(null);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                          "bg-white/5 hover:bg-white/10 transition-colors",
                          dragSymbol === symbol && "opacity-60",
                          dragOverSymbol === symbol && "ring-1 ring-white/30"
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
            <div
              className={cn(
                "h-full rounded-xl border border-white/10 bg-black/20 overflow-hidden transition-opacity duration-200",
                isTransitioning && "opacity-70"
              )}
            >
              <TradingChart
                ticker={primarySymbol}
                data={displaySpread || displayCompare ? undefined : chartData}
                lineData={
                  displaySpread
                    ? spreadData
                    : displayCompare
                      ? primaryLineData
                      : undefined
                }
                comparisons={overlaySymbols}
                comparisonData={comparisonData}
                showComparisons={displaySpread ? showLegs : displayCompare}
                fitKey={fitKey}
                visibleBars={visibleBars}
                secondsVisible={secondsVisible}
                sessionLevels={sessionLevels}
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
