"use client";

import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SYMBOL_COLORS } from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { Button } from "@/components/ui/button";

interface SymbolChipsProps {
  orderedSymbols: string[];
  onRemoveComparison: (symbol: string) => void;
  onReorderSelection: (order: string[]) => void;
}

export function SymbolChips({
  orderedSymbols,
  onRemoveComparison,
  onReorderSelection,
}: SymbolChipsProps) {
  const move = (symbol: string, dir: -1 | 1) => {
    const idx = orderedSymbols.indexOf(symbol);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= orderedSymbols.length) return;
    const next = [...orderedSymbols];
    [next[idx], next[target]] = [next[target], next[idx]];
    onReorderSelection(next);
  };

  return (
    <div className="flex items-center flex-wrap gap-2 flex-1">
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
          <div className="flex items-center gap-0.5 ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => move(symbol, -1)}
              disabled={index === 0}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => move(symbol, 1)}
              disabled={index === orderedSymbols.length - 1}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
            {orderedSymbols.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onRemoveComparison(symbol)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
