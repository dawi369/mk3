"use client";

import React from "react";
import { Plus, Settings, ChevronDown, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useTickerModal, TIMEFRAMES, type Timeframe } from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { cn } from "@/lib/utils";

export function ChartToolbar() {
  const { timeframe, setTimeframe, isSidebarOpen, toggleSidebar } = useTickerModal();

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-black/20">
      {/* Left side actions */}
      <div className="flex items-center gap-1">
        {/* Add Symbol */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => {
            // TODO: Open spotlight in symbol search mode
            console.log("Open symbol search");
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Symbol</span>
          <kbd className="hidden md:inline-flex ml-1 px-1 py-0.5 rounded bg-white/10 text-[10px] font-mono">
            ⌘Q
          </kbd>
        </Button>

        {/* Timeframe Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              {timeframe}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[80px]">
            <DropdownMenuLabel className="text-xs">Timeframe</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TIMEFRAMES.map((tf, index) => (
              <DropdownMenuItem
                key={tf}
                onClick={() => setTimeframe(tf as Timeframe)}
                className={cn("text-xs", timeframe === tf && "bg-accent")}
              >
                <span className="flex-1">{tf}</span>
                <kbd className="text-[10px] text-muted-foreground">{index + 1}</kbd>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Indicators */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              Indicators
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[120px]">
            <DropdownMenuLabel className="text-xs">AI Indicators</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Coming soon...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Settings */}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Settings className="w-3.5 h-3.5" />
        </Button>

        {/* Toggle Sidebar */}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleSidebar}>
          {isSidebarOpen ? (
            <PanelRightClose className="w-3.5 h-3.5" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
