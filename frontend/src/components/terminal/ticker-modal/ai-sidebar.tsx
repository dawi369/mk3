"use client";

import React from "react";
import { Sparkles, TrendingUp, BarChart3, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface AISidebarProps {
  isOpen: boolean;
}

export function AISidebar({ isOpen }: AISidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-64 border-l border-white/10 bg-black/20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">AI Insights</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Signals Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium uppercase tracking-wider">Signals</span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground">AI trading signals coming soon...</p>
          </div>
        </div>

        {/* Predictions Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Brain className="w-3.5 h-3.5" />
            <span className="font-medium uppercase tracking-wider">Predictions</span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground">Price predictions coming soon...</p>
          </div>
        </div>

        {/* Sentiment Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="font-medium uppercase tracking-wider">Sentiment</span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs">Market Sentiment</span>
              <span className="text-xs font-bold text-emerald-500">Bullish</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-[65%] bg-emerald-500 rounded-full" />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Bearish</span>
              <span>Bullish</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
