"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPREAD_PRESETS, type SpreadPresetId } from "@/lib/chart-utils";
import { SYMBOL_COLORS } from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { MAX_SPREAD_LEGS, type SpreadLeg } from "@/types/ticker.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Delay (ms) before closing a hover-opened dropdown */
const HOVER_CLOSE_DELAY = 150;

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

interface SpreadControlsProps {
  spreadLegs: SpreadLeg[];
  primarySymbol: string;
  orderedSymbols: string[];
  activePreset: SpreadPresetId;

  onToggleSign: (symbol: string) => void;
  onMoveLeg: (symbol: string, dir: -1 | 1) => void;
  onRemove: (symbol: string) => void;
  onReverse: () => void;
  onApplyPreset: (id: SpreadPresetId) => void;
}

export function SpreadControls({
  spreadLegs,
  primarySymbol,
  orderedSymbols,
  activePreset,

  onToggleSign,
  onMoveLeg,
  onRemove,
  onReverse,
  onApplyPreset,
}: SpreadControlsProps) {
  const presetsDropdown = useHoverDropdown();
  const activePresetLabel = SPREAD_PRESETS.find(p => p.id === activePreset)?.label.split(" ")[0] ?? "Calendar";

  return (
    <>
      {/* Spread pills */}
      <div className="flex items-center flex-wrap gap-2 flex-1">
        {spreadLegs.length <= 1 && (
          <span className="text-xs text-muted-foreground">
            {spreadLegs.length === 0
              ? `Select up to ${MAX_SPREAD_LEGS} symbols to build a spread.`
              : "Add another symbol to calculate a spread."}
          </span>
        )}
        {spreadLegs.map((leg, index) => (
          <div
            key={leg.symbol}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
              "bg-white/5 hover:bg-white/10 transition-colors"
            )}
          >
            <button
              onClick={() => onToggleSign(leg.symbol)}
              className={cn(
                "px-1 rounded font-mono text-[10px]",
                leg.weight >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {leg.weight > 0 ? "+" : ""}{leg.weight}
            </button>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SYMBOL_COLORS[(index + 1) % SYMBOL_COLORS.length] }}
            />
            <span className="font-mono">{leg.symbol}</span>
            <div className="flex items-center gap-0.5 ml-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onMoveLeg(leg.symbol, -1)}
                disabled={index === 0}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onMoveLeg(leg.symbol, 1)}
                disabled={index === spreadLegs.length - 1}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onRemove(leg.symbol)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons - right aligned */}
      <div className="flex items-center gap-2">
        <DropdownMenu open={presetsDropdown.open} onOpenChange={presetsDropdown.setOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              {...presetsDropdown.triggerProps}
            >
              {activePresetLabel}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[180px]"
            onCloseAutoFocus={(e) => e.preventDefault()}
            {...presetsDropdown.contentProps}
          >
            <DropdownMenuLabel className="text-xs">Spreads</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SPREAD_PRESETS.map((preset) => {
              const needed = preset.weights.length;
              const have = orderedSymbols.length;
              const disabled = have < needed;
              const extra = needed - have;
              return (
                <DropdownMenuItem
                  key={preset.id}
                  disabled={disabled}
                  className={cn("text-xs", preset.id === activePreset && "bg-accent")}
                  onClick={() => onApplyPreset(preset.id)}
                >
                  <span className="flex-1">{preset.label}</span>
                  {disabled && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      +{extra} more
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={onReverse}
          disabled={spreadLegs.length === 0}
        >
          <ArrowLeftRight className="w-3 h-3" />
          Reverse
        </Button>
      </div>
    </>
  );
}
