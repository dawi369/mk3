"use client";

import React from "react";
import { X } from "lucide-react";
import { useTickerModal, SYMBOL_COLORS } from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { MAX_COMPARISONS } from "@/types/ticker.types";
import { cn } from "@/lib/utils";

export function ChartLegend() {
  const { primarySymbol, comparisons, removeComparison } = useTickerModal();

  if (!primarySymbol) return null;

  const allSymbols = [primarySymbol, ...comparisons];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/10 bg-black/20 overflow-x-auto">
      {allSymbols.map((symbol, index) => (
        <div
          key={symbol}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
            "bg-white/5 hover:bg-white/10 transition-colors"
          )}
        >
          {/* Color indicator */}
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: SYMBOL_COLORS[index % SYMBOL_COLORS.length] }}
          />
          <span>{symbol}</span>
          {/* Remove button (only for comparison symbols, not primary) */}
          {index > 0 && (
            <button
              onClick={() => removeComparison(symbol)}
              className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      {comparisons.length === 0 && (
        <span className="text-xs text-muted-foreground ml-2">Add symbols to compare (max {MAX_COMPARISONS})</span>
      )}
    </div>
  );
}
