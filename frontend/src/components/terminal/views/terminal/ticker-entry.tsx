"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MarketMover } from "@/components/terminal/_shared/mock-data";

interface TickerEntryProps {
  data?: MarketMover; // Optional for now while scaffolding
  onClick?: () => void;
  className?: string;
}

export const TickerEntry = React.memo(
  ({ data, onClick, className }: TickerEntryProps) => {
    return (
      <Card
        className={cn(
          "relative flex w-full overflow-hidden rounded-sm border border-border/10 bg-card p-2 hover:bg-accent/5 transition-colors cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        {/* Zone 1: Data Cluster (85%) */}
        <div className="flex-[0.85] flex flex-col justify-between border-r border-border/5 pr-2">
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">[Zone 1: Top]</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">[Zone 1: Mid]</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">[Zone 1: Bot]</span>
            </div>
        </div>

        {/* Zone 2: Pulse Bar (15%) */}
        <div className="flex-[0.15] relative ml-2 flex flex-col items-center justify-center bg-accent/5 rounded-sm">
             <span className="text-[9px] text-muted-foreground -rotate-90 whitespace-nowrap">Zone 2</span>
        </div>
      </Card>
    );
  }
);

TickerEntry.displayName = "TickerEntry";
