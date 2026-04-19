"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/chart-utils";
import { Button } from "@/components/ui/button";

interface ModalHeaderProps {
  headerItems: { symbol: string; price: number; changePercent: number }[];
  spreadValue?: number | null;
  onClose: () => void;
}

export function ModalHeader({ headerItems, spreadValue, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0">
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
        {spreadValue != null && (
          <div className="flex items-baseline gap-2 ml-1 pl-3 border-l border-white/10">
            <span className="text-sm text-muted-foreground">Spread</span>
            <span className="text-base font-mono font-bold">{formatNumber(spreadValue)}</span>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
