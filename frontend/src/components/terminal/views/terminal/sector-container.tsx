"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface SectorContainerProps {
  title: string;
  openInterest?: number;
  openInterestPercent?: number;
  avgChange?: number;
  isUpdating?: boolean; 
  children?: React.ReactNode;
  className?: string;
  // --- TEMPORARY: This prop controls how many rows of TickerEntry are visible ---
  visibleRows?: 3 | 4;
}

// Gap between items in px
const GRID_GAP = 4; // gap-1 = 4px

function formatOpenInterest(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function SectorContainer({
  title,
  openInterest,
  openInterestPercent,
  avgChange,
  isUpdating,
  children,
  className,
  visibleRows = 3,
}: SectorContainerProps) {
  // Calculate height for each row: (100% - gaps) / rows
  // Using CSS calc: grid-auto-rows: calc((100% - (rows-1)*gap) / rows)
  const rowHeight = `calc((100% - ${(visibleRows - 1) * GRID_GAP}px) / ${visibleRows})`;
  const hasChildren = React.Children.count(children) > 0;
  const openInterestLabel = openInterest !== undefined ? formatOpenInterest(openInterest) : "--";
  const openInterestPercentLabel =
    openInterestPercent !== undefined ? `${openInterestPercent.toFixed(1)}%` : "--";
  const hasOpenInterest = openInterest !== undefined;
  const hasOpenInterestPercent = openInterestPercent !== undefined;
  const openInterestTone =
    hasOpenInterest || hasOpenInterestPercent ? "text-muted-foreground/70" : "text-muted-foreground/40";

  return (
    <Card className={cn("flex flex-col h-full overflow-hidden border-none shadow-none bg-terminal-card gap-0 p-0 rounded-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1! px-3 pt-2 border-b border-white/5">
        <CardTitle className="font-bold text-base tracking-wide text-foreground/90 uppercase">
          {title}
        </CardTitle>
        
        {/* Right: Controls & Metrics - Floating in header */}
        <div className="flex items-center gap-3">
            <span
              className={cn(
                "font-mono text-xs uppercase font-bold tracking-wider transition-colors duration-300",
                isUpdating ? "text-white" : openInterestTone
              )}
            >
              {/* {openInterestLabel}  */}
              OI {openInterestPercentLabel} 
            </span>

            {avgChange !== undefined && (
              <span className={cn(
                  "font-mono text-xs font-bold tracking-wider transition-colors duration-300",
                   avgChange >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
              </span>
            )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-1">
        {hasChildren ? (
            <div 
              className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] content-start gap-1 h-full overflow-y-auto pr-0.5 pb-1 custom-scrollbar"
              style={{
                // --- TEMPORARY: Dynamic row height based on visibleRows ---
                gridAutoRows: rowHeight,
              }}
            >
              {children}
            </div>
        ) : (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-muted-foreground/40 select-none">
              <Activity className="w-8 h-8 opacity-50 mb-2" />
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                Ready for Data
              </span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
