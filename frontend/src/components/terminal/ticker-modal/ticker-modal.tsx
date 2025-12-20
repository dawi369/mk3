"use client";

import React, { useEffect, useState } from "react";
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

export function TickerModal() {
  const { isOpen, ticker, close, isSidebarOpen, comparisons } = useTickerModal();
  const { isRolling } = useFrontMonth();

  const productCode = ticker ? extractRoot(ticker.ticker) : "";
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

  if (!ticker) return null;

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && close()} handleOnly>
      <DrawerContent className="h-[92vh] max-h-none! rounded-t-2xl [&>div.bg-muted]:hidden">
        {/* Accessibility: Hidden title and description for screen readers */}
        <DrawerTitle asChild>
          <VisuallyHidden.Root>{ticker.ticker} Details</VisuallyHidden.Root>
        </DrawerTitle>
        <DrawerDescription asChild>
          <VisuallyHidden.Root>Trading view for {ticker.ticker}</VisuallyHidden.Root>
        </DrawerDescription>

        {/* Header - minimal */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold tracking-tight">{ticker.ticker}</h2>
              {tickerIsRolling && <RefreshCw className="h-3 w-3 text-white" />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-mono">{formatNumber(ticker.price)}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  ticker.change >= 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {ticker.change >= 0 ? "+" : ""}
                {ticker.change.toFixed(2)}%
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
              <TradingChart ticker={ticker.ticker} comparisons={comparisons} />
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
