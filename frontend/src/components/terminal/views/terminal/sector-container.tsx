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
  rvol?: number;
  avgChange?: number;
  isUpdating?: boolean; 
  children?: React.ReactNode;
  className?: string;
}

export function SectorContainer({
  title,
  rvol,
  avgChange,
  isUpdating,
  children,
  className,
}: SectorContainerProps) {
  return (
    <Card className={cn("flex flex-col h-full overflow-hidden border-none shadow-none bg-terminal-card gap-0 p-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
        <CardTitle className="font-roboto font-bold text-sm tracking-wide text-foreground/90 uppercase">
          {title}
        </CardTitle>
        
        {/* Right: Controls & Metrics - Floating in header */}
        <div className="flex items-center gap-3">


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
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-1">
        {children ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] content-start gap-1 h-full overflow-y-auto pr-0.5 pb-1 custom-scrollbar">
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
