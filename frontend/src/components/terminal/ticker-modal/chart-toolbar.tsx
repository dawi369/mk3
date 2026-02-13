"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ChartToolbarProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  showSessionLevels: boolean;
  onToggleSessionLevels: () => void;
  displayCompare: boolean;
  onAddSymbol: () => void;
}

/** Delay (ms) before closing a hover-opened dropdown */
const HOVER_CLOSE_DELAY = 150;

/**
 * Hook for a dropdown that opens on hover and also supports click.
 * Returns controlled `open` state + pointer handlers for trigger & content.
 */
function useHoverDropdown() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  }, [clearClose]);

  const triggerProps = {
    onPointerEnter: () => { clearClose(); setOpen(true); },
    onPointerLeave: scheduleClose,
  };

  const contentProps = {
    onPointerEnter: clearClose,
    onPointerLeave: scheduleClose,
  };

  return { open, setOpen, triggerProps, contentProps };
}

export function ChartToolbar({
  timeframe,
  onTimeframeChange,
  showSessionLevels,
  onToggleSessionLevels,
  displayCompare,
  onAddSymbol,
}: ChartToolbarProps) {
  const tfDropdown = useHoverDropdown();
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);

  useEffect(() => {
    if (!indicatorsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIndicatorsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [indicatorsOpen]);

  return (
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

        {/* Timeframe dropdown */}
        <DropdownMenu open={tfDropdown.open} onOpenChange={tfDropdown.setOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              {...tfDropdown.triggerProps}
            >
              {timeframe}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[80px]"
            onCloseAutoFocus={(e) => e.preventDefault()}
            {...tfDropdown.contentProps}
          >
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

        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() => setIndicatorsOpen(true)}
        >
          Indicators
        </Button>

        <div
          className={cn(
            displayCompare && "opacity-0 max-w-0 pointer-events-none overflow-hidden"
          )}
        >
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-6 px-2 text-xs",
              showSessionLevels && "bg-white/10 text-foreground"
            )}
            onClick={onToggleSessionLevels}
          >
            Levels
          </Button>
        </div>
        {indicatorsOpen && (
          <div className="fixed inset-0 z-[60]">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIndicatorsOpen(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Indicators"
                className="pointer-events-auto w-[320px] rounded-lg border border-white/10 bg-background/95 p-4 shadow-xl backdrop-blur-sm"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="text-sm font-semibold text-foreground">Indicators</div>
                <div className="mt-1 text-xs text-muted-foreground">Coming soon...</div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
