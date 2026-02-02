"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MarketMover } from "@/components/terminal/_shared/mock-data";

interface TickerEntryProps {
  data?: MarketMover;
  onClick?: () => void;
  className?: string;
}

// --- Zone 1: Data Cluster Component ---
const DataZone = () => {
  return (
    <div className="flex flex-col justify-between h-full py-2 px-2">
      {/* Row 1: Identity */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground/50 text-[10px] font-mono">Row 1: Symbol | Expiry</span>
      </div>
      {/* Row 2: Price Action (Hero) */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground/50 text-[10px] font-mono">Row 2: Price | Change</span>
      </div>
      {/* Row 3: Context */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground/50 text-[10px] font-mono">Row 3: Vol | VWAP</span>
      </div>
    </div>
  );
};

// --- Zone 2: Pulse Bar Component ---
const PulseBarZone = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-[8px] text-muted-foreground/30 font-mono -rotate-90 whitespace-nowrap">
        PULSE
      </span>
    </div>
  );
};

export const TickerEntry = React.memo(
  ({ data, onClick, className }: TickerEntryProps) => {
    return (
      <Card
        className={cn(
          "relative grid grid-cols-[17fr_1px_3fr] w-full h-full overflow-hidden rounded-sm border border-border/10 bg-card hover:bg-accent/5 transition-colors cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        {/* Zone 1: Data Cluster (85%) */}
        <div className="h-full overflow-hidden">
          <DataZone />
        </div>

        {/* Separator */}
        <div className="h-auto my-2 bg-white/20" />

        {/* Zone 2: Pulse Bar (remaining ~15%) */}
        <div className="h-full overflow-hidden">
          <PulseBarZone />
        </div>
      </Card>
    );
  }
);

TickerEntry.displayName = "TickerEntry";

