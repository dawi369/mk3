"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { AssetClassData, MarketMover } from "./mock-data";
import { cn } from "@/lib/utils";

interface TerminalCardProps {
  data: AssetClassData;
  onClick?: () => void;
}

export function TerminalCard({ data, onClick }: TerminalCardProps) {
  // Default to the first loser as in the image example, or first winner
  const [selectedTicker, setSelectedTicker] = useState<MarketMover>(
    data.losers[0] || data.winners[0]
  );

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatVolume = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const TickerRow = ({ item, isWinner }: { item: MarketMover; isWinner: boolean }) => {
    const isSelected = selectedTicker.ticker === item.ticker;
    return (
      <div
        className={cn(
          "flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-colors",
          isSelected ? "bg-muted/50" : "hover:bg-muted/20"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTicker(item);
        }}
      >
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight">{item.ticker}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {formatNumber(item.price)}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-mono font-medium",
            isWinner ? "text-emerald-500" : "text-rose-500"
          )}
        >
          {isWinner ? "+" : ""}
          {item.change}%
        </span>
      </div>
    );
  };

  return (
    <Card
      className="h-full bg-card border-border/40 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
        <h3 className="font-bold text-lg tracking-tight">{data.title}</h3>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" />
      </div>

      <CardContent className="flex-1 p-0 grid grid-cols-12 h-full">
        {/* Left Column: Gainers */}
        <div className="col-span-3 border-r border-border/20 p-4 flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Top Gainers
          </p>
          <div className="space-y-1">
            {data.winners.map((item) => (
              <TickerRow key={item.ticker} item={item} isWinner={true} />
            ))}
          </div>
        </div>

        {/* Middle Column: Losers */}
        <div className="col-span-3 border-r border-border/20 p-4 flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Top Losers
          </p>
          <div className="space-y-1">
            {data.losers.map((item) => (
              <TickerRow key={item.ticker} item={item} isWinner={false} />
            ))}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="col-span-6 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-bold tracking-tight">{selectedTicker.ticker}</h2>
              <span className="text-xs font-medium text-muted-foreground">{data.activeMonth}</span>
            </div>
            <div className="mb-1">
              <span className="text-4xl font-mono font-medium tracking-tighter">
                {formatNumber(selectedTicker.price)}
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium mb-8",
                selectedTicker.change >= 0 ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {selectedTicker.change >= 0 ? "↑" : "↓"} {Math.abs(selectedTicker.change)}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex justify-between items-baseline border-b border-border/10 pb-1">
              <span className="text-xs text-muted-foreground">Vol</span>
              <span className="text-sm font-mono">{formatVolume(selectedTicker.stats.volume)}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-border/10 pb-1">
              <span className="text-xs text-muted-foreground">Open</span>
              <span className="text-sm font-mono">{formatNumber(selectedTicker.stats.open)}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-border/10 pb-1">
              <span className="text-xs text-muted-foreground">High</span>
              <span className="text-sm font-mono">{formatNumber(selectedTicker.stats.high)}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-border/10 pb-1">
              <span className="text-xs text-muted-foreground">Low</span>
              <span className="text-sm font-mono">{formatNumber(selectedTicker.stats.low)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
