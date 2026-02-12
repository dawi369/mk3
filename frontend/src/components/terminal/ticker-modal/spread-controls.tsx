"use client";

import React from "react";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
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

interface SpreadControlsProps {
  spreadLegs: SpreadLeg[];
  primarySymbol: string;
  orderedSymbols: string[];
  showLegs: boolean;
  onSetShowLegs: (v: boolean | ((prev: boolean) => boolean)) => void;
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
  showLegs,
  onSetShowLegs,
  onToggleSign,
  onMoveLeg,
  onRemove,
  onReverse,
  onApplyPreset,
}: SpreadControlsProps) {
  return (
    <>
      {/* Spread pills */}
      <div className="flex items-center flex-wrap gap-2 flex-1">
        {spreadLegs.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Select up to {MAX_SPREAD_LEGS} symbols to build a spread.
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
              {leg.symbol !== primarySymbol && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onRemove(leg.symbol)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons - right aligned */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              Presets
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuLabel className="text-xs">Popular Spreads</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SPREAD_PRESETS.map((preset) => {
              const disabled = orderedSymbols.length < preset.weights.length;
              return (
                <DropdownMenuItem
                  key={preset.id}
                  disabled={disabled}
                  className="text-xs"
                  onClick={() => onApplyPreset(preset.id)}
                >
                  {preset.label}
                  {disabled && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      Need {preset.weights.length}
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

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onSetShowLegs((prev: boolean) => !prev)}
          disabled={spreadLegs.length === 0}
          aria-label={showLegs ? "Hide leg overlays" : "Show leg overlays"}
        >
          {showLegs ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </>
  );
}
