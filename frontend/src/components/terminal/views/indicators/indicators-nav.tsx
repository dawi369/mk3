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
    <div className="flex items-center gap-3">
      {/* Search */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 gap-2 border-white/5 bg-white/2 hover:bg-white/5 transition-all"
        onClick={onSearchClick}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="hidden sm:inline text-xs font-bold text-muted-foreground/80 tracking-tight">
          Search Symbols
        </span>
        <kbd className="hidden md:inline-flex ml-2 px-1 py-0 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-muted-foreground/40">
          ⌘K
        </kbd>
      </Button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Timeframe Selector */}
      <div className="flex items-center rounded-lg border border-white/5 bg-white/2 p-0.5">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={cn(
              "px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-md transition-all duration-200",
              timeframe === tf
                ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                : "hover:bg-white/5 text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Asset Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-2 border-white/5 bg-white/2 hover:bg-white/5"
          >
            <span className="text-[10px] font-bold tracking-widest uppercase">
              {selectedAsset.value}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[180px] bg-card border-white/10 shadow-2xl"
        >
          {ASSETS.map((a) => (
            <DropdownMenuItem
              key={a.value}
              onClick={() => onAssetChange(a.value)}
              className={cn(
                "text-[10px] font-bold tracking-widest uppercase py-2 cursor-pointer",
                asset === a.value
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
