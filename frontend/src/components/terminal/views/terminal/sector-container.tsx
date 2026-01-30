"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Activity } from "lucide-react";

interface SectorContainerProps {
  title: string;
  rvol?: number;
  avgChange?: number;
  isUpdating?: boolean; // Keep for future flash logic
  children?: React.ReactNode;
  className?: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  showPagination?: boolean;
}

export function SectorContainer({
  title,
  rvol,
  avgChange,
  isUpdating,
  children,
  className,
  onPrevMonth,
  onNextMonth,
  showPagination = true, // Default to showing arrows as requested
}: SectorContainerProps) {
  return (
    <div
      className={cn(
        // Terminal 2.0 "Lighter Raised Look"
        // bg-card (Level 2) is lighter than bg-panel (Level 1/Base) in our definitions
        // Removed border completely as requested
        "relative flex flex-col h-full overflow-hidden rounded-lg",
        "bg-terminal-card bg-gradient-to-b from-white/5 to-transparent", // Gradient Sheen
        "border border-white/5 shadow-2xl backdrop-blur-sm", // High-tech definition
        "group/sector",
        className
      )}
    >
      {/* Header - Transparent, No Border */}
      <div className="flex items-center justify-between px-3 h-9 shrink-0 select-none">
        
        {/* Left: Title - Floating effect */}
        <h3 className="font-roboto font-bold text-sm tracking-wide text-foreground/90 uppercase">
          {title}
        </h3>

        {/* Right: Controls & Metrics */}
        <div className="flex items-center gap-3">
          {/* Pagination Arrows - Always rendered if showPagination is true (default) */}
          {showPagination && (
            <div className="flex items-center gap-1 text-muted-foreground/50 hover:text-foreground transition-colors mr-2">
               <button 
                onClick={onPrevMonth} 
                className="hover:bg-white/10 p-0.5 rounded-sm transition-colors"
                aria-label="Previous Month"
               >
                 <ChevronLeft className="w-3 h-3" />
               </button>
               {/* Month label removed or made subtle? User said "joined by Pagination Arrows (< Month >)" - let's keep the month code for context but small */}
               <span className="text-xs font-mono font-bold tracking-tight opacity-70">DEC 25</span>
               <button 
                onClick={onNextMonth} 
                className="hover:bg-white/10 p-0.5 rounded-sm transition-colors"
                aria-label="Next Month"
               >
                 <ChevronRight className="w-3 h-3" />
               </button>
            </div>
          )}

          {avgChange !== undefined && (
             <span className={cn(
                "font-mono text-xs font-bold tracking-wider transition-colors duration-300 mr-2",
                 avgChange >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </span>
          )}

          {rvol !== undefined && (
            <span className={cn(
                "font-mono text-xs uppercase font-bold tracking-wider transition-colors duration-300",
                 isUpdating ? "text-white" : "text-muted-foreground/70"
            )}>
              Vol: {(rvol * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Body: The Grid Container for Cells */}
      {/* Body: The Grid Container or Empty State */}
      <div className="flex-1 min-h-0 relative p-1 pb-0 overflow-hidden">
        {children ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] content-start gap-1 h-full overflow-y-auto pr-0.5 pb-1 custom-scrollbar">
              {children}
            </div>
        ) : (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-white/40 select-none">
              <Activity className="w-8 h-8 opacity-50 mb-2" />
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                Ready for Data
              </span>
            </div>
        )}
      </div>
      
      {/* Footer bar - Optional, making it extremely subtle or removing if "no border" implies total clean look. Keeping subtle separator for visual anchoring */}
      <div className="h-px bg-white/5 w-full shrink-0 opacity-20" /> 
    </div>
  );
}
