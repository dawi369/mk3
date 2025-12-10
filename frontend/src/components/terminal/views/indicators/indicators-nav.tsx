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
    <div className="flex items-center gap-2">
      {/* Search */}
      <Button variant="ghost" size="sm" className="h-8 px-3 gap-2" onClick={onSearchClick}>
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline text-muted-foreground">Search...</span>
        <kbd className="hidden md:inline-flex ml-2 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
          ⌘K
        </kbd>
      </Button>

      {/* Timeframe Selector */}
      <div className="flex items-center rounded-md border border-white/10 overflow-hidden">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium transition-colors",
              timeframe === tf
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Asset Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-3 gap-2">
            <span className="text-xs font-medium">{selectedAsset.value}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {ASSETS.map((a) => (
            <DropdownMenuItem
              key={a.value}
              onClick={() => onAssetChange(a.value)}
              className={cn("text-xs", asset === a.value && "bg-accent")}
            >
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
