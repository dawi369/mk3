"use client";

import React, { useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTickerStore } from "@/store/use-ticker-store";
import { buildTickerSnapshot } from "@/lib/ticker-snapshot";
import type { TickerSnapshot } from "@/types/ticker.types";

// ============================================================================
// Types
// ============================================================================

interface TickerEntryProps {
  symbol: string;
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse symbol into root and expiry (e.g., "ESH6" -> ["ES", "H6"])
 */
function parseSymbol(symbol: string): { root: string; expiry: string } {
  const match = symbol.match(/^([A-Z]{1,4})([FGHJKMNQUVXZ]\d{1,2})$/);
  if (match) {
    return { root: match[1], expiry: match[2] };
  }
  return { root: symbol, expiry: "" };
}

/**
 * Format price with appropriate decimal places
 */
function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 10) return price.toFixed(2);
  if (price >= 1) return price.toFixed(3);
  return price.toFixed(4);
}

/**
 * Format volume in compact notation (e.g., 1.2M, 500K)
 */
function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return volume.toString();
}

/**
 * Format change with sign
 */
function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}`;
}

/**
 * Format percent change with sign
 */
function formatPercent(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}


// ============================================================================
// Sub-Components
// ============================================================================

interface DataZoneProps {
  data: TickerSnapshot;
}

/**
 * Zone 1: Data Cluster (Left 85%)
 * Contains symbol, price, change, and volume in a 3-row layout
 * Typography: Numbers use font-mono (JetBrains Mono), tabular-nums
 */
const DataZone = React.memo(({ data }: DataZoneProps) => {
  const { root, expiry } = parseSymbol(data.symbol);
  const netChange = data.change;
  const percentChange = data.changePercent;
  const isPositive = netChange >= 0;

  return (
    <div className="flex flex-col justify-between h-full py-2 pl-2.5 pr-2.5 overflow-hidden min-w-0">
      {/* Row 1: Identity */}
      <div className="flex items-baseline justify-between gap-2 overflow-hidden">
        <div className="flex items-baseline gap-1 overflow-hidden">
          <span className="text-lg font-bold text-foreground tracking-tight leading-none shrink-0">
            {root}
          </span>
          <span className="text-sm font-mono text-muted-foreground/50 tracking-wide shrink-0">
            {expiry}
          </span>
        </div>
        <span
          className={cn(
            "text-[11px] font-mono font-semibold tabular-nums tracking-tight shrink-0",
            isPositive ? "text-emerald-500/90" : "text-rose-500/90"
          )}
        >
          {formatChange(netChange)}
        </span>
      </div>

      {/* Row 2: Price Action (Hero) */}
      <div className="flex items-baseline justify-between gap-2 overflow-hidden">
        <span className="text-lg font-bold font-mono text-foreground tabular-nums tracking-tight leading-none shrink-0">
          {formatPrice(data.last_price)}
        </span>
        <span
          className={cn(
            "text-[16px] font-mono font-semibold tabular-nums tracking-tight shrink-0",
            isPositive ? "text-emerald-500" : "text-rose-500"
          )}
        >
          {formatPercent(percentChange)}
        </span>
      </div>

      {/* Row 3: Liquidity Context */}
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        <span className="text-[11px] font-mono text-muted-foreground/40 tabular-nums tracking-wider uppercase shrink-0">
          Vol {formatVolume(data.cum_volume)}
        </span>
        {data.vwap && (
          <span className="text-[11px] font-mono text-amber-500/60 tabular-nums shrink-0">
            VWAP {formatPrice(data.vwap)}
          </span>
        )}
      </div>
    </div>
  );
});
DataZone.displayName = "DataZone";

interface PulseBarProps {
  data: TickerSnapshot;
}

/**
 * Zone 2: Pulse Bar (Right 15%)
 * A vertical candle-like visualization showing session range
 * - Track: Day Low to Day High
 * - Reference Line: Previous close
 * - Body: Open to Current (colored by direction)
 */
const PulseBar = React.memo(({ data }: PulseBarProps) => {
  const { session_high, session_low, session_open, last_price, prev_close } = data;
  const range = session_high - session_low;

  // Calculate positions as percentages (0 = bottom, 100 = top)
  const calcPosition = (price: number) => {
    if (range === 0) return 50;
    return ((price - session_low) / range) * 100;
  };

  // Candle body positioning
  const bodyTop = Math.max(session_open, last_price);
  const bodyBottom = Math.min(session_open, last_price);
  const bodyTopPercent = calcPosition(bodyTop);
  const bodyBottomPercent = calcPosition(bodyBottom);
  const bodyHeight = Math.max(bodyTopPercent - bodyBottomPercent, 4); // Min 4% height for visibility

  // Previous close reference line
  const prevClosePercent = calcPosition(prev_close);
  const isGapOut = prev_close > session_high || prev_close < session_low;
  const clampedPrevClose = Math.max(2, Math.min(98, prevClosePercent));

  // Color based on direction
  const isUp = last_price >= session_open;

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="relative h-[80%] w-3 flex items-center justify-center">
        {/* The Track (Full Range Line) */}
        <div className="absolute inset-0 w-px bg-white/8 left-1/2 -translate-x-1/2 rounded-full" />

        {/* Previous Close Reference Line */}
        <div
          className={cn(
            "absolute w-full h-px left-0 transition-colors",
            isGapOut ? "bg-amber-500/70" : "bg-muted-foreground/30"
          )}
          style={{ bottom: `${clampedPrevClose}%` }}
        />

        {/* The Candle Body */}
        <div
          className={cn(
            "absolute w-[6px] left-1/2 -translate-x-1/2 rounded-[1px] transition-all duration-150",
            isUp ? "bg-emerald-500" : "bg-rose-500"
          )}
          style={{
            bottom: `${bodyBottomPercent}%`,
            height: `${bodyHeight}%`,
          }}
        />

        {/* Current Price Marker */}
        <div
          className={cn(
            "absolute left-0 right-0 h-px transition-all duration-150",
            isUp
              ? "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
              : "bg-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.5)]"
          )}
          style={{ bottom: `${calcPosition(last_price)}%` }}
        />
      </div>
    </div>
  );
});
PulseBar.displayName = "PulseBar";

// ============================================================================
// Main Component
// ============================================================================

export const TickerEntry = React.memo(({ symbol, className }: TickerEntryProps) => {
  const mode = useTickerStore((state) => state.mode);
  const entity = useTickerStore((state) => state.entitiesByMode[mode][symbol]);
  const bars = useTickerStore((state) => state.seriesByMode[mode][symbol]);
  const snapshot = useTickerStore((state) => state.snapshotsBySymbol[symbol]);
  const session = useTickerStore((state) => state.sessionsBySymbol[symbol]);
  const selection = useTickerStore((state) => state.selectionByMode[mode]);
  const isModalOpen = useTickerStore((state) => state.isModalOpen);
  const openPrimary = useTickerStore((state) => state.openPrimary);
  const toggleSelectShift = useTickerStore((state) => state.toggleSelectShift);

  const snapshotData = useMemo(
    () => buildTickerSnapshot(symbol, bars, entity?.latestBar, snapshot, session),
    [symbol, bars, entity?.latestBar, snapshot, session]
  );

  const isSelected = selection.selected.includes(symbol) && !isModalOpen;
  const isPrimary = selection.primary === symbol && !isModalOpen;

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.shiftKey) {
        toggleSelectShift(symbol);
        return;
      }

      openPrimary(symbol);
    },
    [symbol, openPrimary, toggleSelectShift]
  );

  return (
    <Card
      className={cn(
        // Base layout - 85% data / separator / 15% pulse
        "relative grid grid-cols-[1fr_1px_28px] gap-0 w-full h-full overflow-hidden",
        // Styling - Bloomberg/fey.com inspired dark terminal aesthetic
        "rounded-sm border border-white/4 bg-[#141414]",
        // Hover & interaction
        "hover:bg-[#1a1a1a] hover:border-white/8 transition-all duration-150 cursor-pointer",
        // Subtle inner glow on hover
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        "select-none cursor-default",
        isSelected && "border-white/20 bg-[#171717]",
        isPrimary && "border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
        className
      )}
      onClick={handleClick}
    >
      {/* Zone 1: Data Cluster */}
      <DataZone data={snapshotData} />

      {/* Separator - 1px vertical line */}
      <div className="my-2 bg-white/6" />

      {/* Zone 2: Pulse Bar */}
      <PulseBar data={snapshotData} />
    </Card>
  );
});

TickerEntry.displayName = "TickerEntry";

// ============================================================================
// Mock Data Generator (for development/testing)
// ============================================================================
