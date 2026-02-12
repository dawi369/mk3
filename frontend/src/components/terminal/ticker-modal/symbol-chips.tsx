"use client";

import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { reorderSymbols } from "@/lib/chart-utils";
import { SYMBOL_COLORS } from "@/components/terminal/ticker-modal/ticker-modal-provider";

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
  const [dragSymbol, setDragSymbol] = useState<string | null>(null);
  const [dragOverSymbol, setDragOverSymbol] = useState<string | null>(null);
  const dragSymbolRef = useRef<string | null>(null);

  return (
    <div className="flex items-center flex-wrap gap-2 flex-1">
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
          onReorderSelection(nextOrder);
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
              onReorderSelection(nextOrder);
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
                onClick={() => onRemoveComparison(symbol)}
                className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
