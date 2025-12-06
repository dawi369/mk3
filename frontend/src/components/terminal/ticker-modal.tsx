"use client";

import React, { useEffect, useState } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTickerModal } from "./ticker-modal-provider";
import { BorderTrail } from "@/components/ui/border-trail";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

export function TickerModal() {
  const { isOpen, ticker, close } = useTickerModal();
  // Delay rendering BorderTrail until after animation completes for performance
  const [showBorderTrail, setShowBorderTrail] = useState(false);

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

  // Delay BorderTrail until animation completes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowBorderTrail(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowBorderTrail(false);
    }
  }, [isOpen]);

  if (!ticker) return null;

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && close()}>
      <DrawerContent className="h-[92vh] max-h-none! rounded-t-2xl">
        {/* Border trail effect - delayed until after animation */}
        {showBorderTrail && (
          <BorderTrail
            className="bg-linear-to-r from-blue-500 via-cyan-400 to-blue-500"
            size={120}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "linear",
            }}
          />
        )}

        {/* Accessibility: Hidden title and description for screen readers */}
        <DrawerTitle asChild>
          <VisuallyHidden.Root>{ticker.ticker} Details</VisuallyHidden.Root>
        </DrawerTitle>
        <DrawerDescription asChild>
          <VisuallyHidden.Root>Trading view for {ticker.ticker}</VisuallyHidden.Root>
        </DrawerDescription>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">{ticker.ticker}</h2>
            <div className="flex items-center gap-3">
              <span className="text-xl font-mono">{formatNumber(ticker.price)}</span>
              <span
                className={cn(
                  "text-lg font-medium",
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
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area - placeholder for chart */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full rounded-xl border border-white/10 bg-black/20 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">Lightweight Charts</p>
              <p className="text-sm">Chart integration coming in Phase 2</p>
            </div>
          </div>
        </div>

        {/* Footer toolbar - placeholder */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">ESC</kbd> to
            close
          </span>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
