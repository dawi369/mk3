"use client";

import React from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, type RangePresetId } from "@/lib/chart-utils";
import { TIMEFRAMES, type Timeframe } from "@/types/ticker.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ChartToolbarProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  rangePreset: RangePresetId | "custom";
  onRangePresetChange: (id: RangePresetId | "custom") => void;
  showSessionLevels: boolean;
  onToggleSessionLevels: () => void;
  displayCompare: boolean;
  onAddSymbol: () => void;
}

export function ChartToolbar({
  timeframe,
  onTimeframeChange,
  rangePreset,
  onRangePresetChange,
  showSessionLevels,
  onToggleSessionLevels,
  displayCompare,
  onAddSymbol,
}: ChartToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={onAddSymbol}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Symbol</span>
          <kbd className="hidden md:inline-flex ml-1 px-1 py-0.5 rounded bg-white/10 text-[10px] font-mono">
            Ctrl+K
          </kbd>
        </Button>

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
                onClick={() => onTimeframeChange(tf)}
                className={cn("text-xs", timeframe === tf && "bg-accent")}
              >
                <span className="flex-1">{tf}</span>
                <kbd className="text-[10px] text-muted-foreground">{index + 1}</kbd>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground/70">Range</span>
          <ToggleGroup
            type="single"
            value={rangePreset === "custom" ? "" : rangePreset}
            onValueChange={(val) =>
              onRangePresetChange(val ? (val as RangePresetId) : "custom")
            }
            className="bg-muted/50 p-0.5 rounded-md border border-white/5"
          >
            {RANGE_PRESETS.map((preset) => (
              <ToggleGroupItem
                key={preset.id}
                value={preset.id}
                size="sm"
                className="h-7 px-2 text-xs data-[state=on]:bg-background"
              >
                {preset.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              Indicators
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Coming soon...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div
          className={cn(
            "transition-all duration-200 overflow-hidden",
            displayCompare
              ? "opacity-0 max-w-0 pointer-events-none"
              : "opacity-100 max-w-[120px]"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs gap-1",
              showSessionLevels && "bg-white/10 text-foreground"
            )}
            onClick={onToggleSessionLevels}
          >
            Levels
          </Button>
        </div>
      </div>
    </div>
  );
}
