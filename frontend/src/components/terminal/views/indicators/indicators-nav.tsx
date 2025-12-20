"use client";

import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"] as const;
const ASSETS = [
  { label: "ES (S&P 500)", value: "ES" },
  { label: "NQ (Nasdaq)", value: "NQ" },
  { label: "YM (Dow)", value: "YM" },
  { label: "GC (Gold)", value: "GC" },
  { label: "CL (Crude)", value: "CL" },
  { label: "All Assets", value: "ALL" },
] as const;

interface IndicatorsNavProps {
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  asset: string;
  onAssetChange: (asset: string) => void;
  onSearchClick?: () => void;
}

export function IndicatorsNav({
  timeframe,
  onTimeframeChange,
  asset,
  onAssetChange,
  onSearchClick,
}: IndicatorsNavProps) {
  const selectedAsset = ASSETS.find((a) => a.value === asset) || ASSETS[0];

  return (
    <div className="flex items-center gap-4">
      {/* Search - Ultra minimal */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 gap-2 text-muted-foreground/40 hover:text-white hover:bg-white/5 transition-all group"
        onClick={onSearchClick}
      >
        <Search className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
        <span className="hidden sm:inline text-xs font-bold tracking-tight uppercase">Search</span>
      </Button>

      <div className="w-px h-5 bg-white/5" />

      {/* Asset Selector - More prominent */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-4 gap-3 bg-white/5 hover:bg-white/10 border border-white/5"
          >
            <span className="text-xs font-black tracking-widest uppercase">
              {selectedAsset.label}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[200px] bg-neutral-950 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50"
        >
          {ASSETS.map((a) => (
            <DropdownMenuItem
              key={a.value}
              onClick={() => onAssetChange(a.value)}
              className={cn(
                "text-[10px] font-bold tracking-[0.2em] uppercase py-3 px-4 cursor-pointer focus:bg-white/10 focus:text-white",
                asset === a.value ? "bg-white/5 text-white" : "text-muted-foreground"
              )}
            >
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Timeframe Selector - Pill style */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900/50 border border-white/5 rounded-full">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={cn(
              "px-3 py-1 text-[10px] font-black tracking-tighter uppercase rounded-full transition-all duration-300",
              timeframe === tf
                ? "bg-white text-black shadow-lg"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}
