"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTickerModal } from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { TradingChart } from "@/components/terminal/ticker-modal/trading-chart";
import { ChartToolbar } from "@/components/terminal/ticker-modal/chart-toolbar";
import { ChartLegend } from "@/components/terminal/ticker-modal/chart-legend";
import { AISidebar } from "@/components/terminal/ticker-modal/ai-sidebar";
import { useFrontMonth } from "@/providers/front-month-provider";
import { extractRoot } from "@/lib/month-utils";
import { useTickerStore } from "@/store/use-ticker-store";
import { buildTickerSnapshot } from "@/lib/ticker-snapshot";
import type { CandlestickData, Time } from "lightweight-charts";

export function TickerModal() {
  const { isOpen, primarySymbol, close, isSidebarOpen, comparisons } = useTickerModal();
  const { isRolling } = useFrontMonth();
  const mode = useTickerStore((state) => state.mode);
  const entity = useTickerStore((state) =>
    primarySymbol ? state.entitiesByMode[mode][primarySymbol] : undefined
  );
  const bars = useTickerStore((state) =>
    primarySymbol ? state.seriesByMode[mode][primarySymbol] : undefined
  );

  const productCode = primarySymbol ? extractRoot(primarySymbol) : "";
  const tickerIsRolling = isRolling(productCode);

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
  const chartData: CandlestickData<Time>[] | undefined = useMemo(() => {
    if (!bars || bars.length === 0) return undefined;
    return bars.map((bar) => ({
      time: Math.floor(bar.startTime / 1000) as Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));
  }, [bars]);

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

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

        {/* Header - minimal */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
               <h2 className="text-lg font-bold tracking-tight">{primarySymbol}</h2>
               {tickerIsRolling && <RefreshCw className="h-3 w-3 text-white" />}
             </div>
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

          {/* Close button */}
          <button
            onClick={close}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <ChartToolbar />

        {/* Main content area with chart and sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chart area */}
          <div className="flex-1 p-3 overflow-hidden">
            <div className="h-full rounded-xl border border-white/10 bg-black/20 overflow-hidden">
              <TradingChart ticker={primarySymbol} comparisons={comparisons} data={chartData} />
            </div>
          </div>

          {/* AI Sidebar */}
          <AISidebar isOpen={isSidebarOpen} />
        </div>

        {/* Legend */}
        <ChartLegend />
      </DrawerContent>
    </Drawer>
  );
}
