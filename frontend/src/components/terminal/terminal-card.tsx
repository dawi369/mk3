"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetClassData, MarketMover } from "./mock-data";
import { cn } from "@/lib/utils";

interface TerminalCardProps {
  data: AssetClassData;
  onClick?: () => void;
}

export function TerminalCard({ data, onClick }: TerminalCardProps) {
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
          "flex flex-col py-1 px-1.5 rounded cursor-pointer transition-colors w-full",
          isSelected ? "bg-muted/50" : "hover:bg-muted/20"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTicker(item);
        }}
      >
        <div className="flex items-center justify-between w-full gap-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight">{item.ticker}</span>
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
        </div>
        <span className="text-xs text-muted-foreground font-mono">{formatNumber(item.price)}</span>
      </div>
    );
  };

  const RVolIndicator = ({ rvol }: { rvol: number }) => (
    <div className="mt-auto pt-1.5 px-1.5">
      <div className="flex justify-between items-end mb-0.5">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          RVol
        </span>
        <span
          className={cn(
            "text-xs font-mono font-bold",
            rvol > 1.2 ? "text-amber-500" : "text-muted-foreground"
          )}
        >
          {rvol.toFixed(2)}x
        </span>
      </div>
      <div className="h-0.5 w-full bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            rvol > 1.2 ? "bg-amber-500" : "bg-muted-foreground/50"
          )}
          style={{ width: `${Math.min(rvol * 50, 100)}%` }}
        />
      </div>
    </div>
  );

  const SentimentIndicator = ({ sentiment }: { sentiment: number }) => (
    <div className="mt-auto pt-1.5 px-1.5">
      <div className="flex justify-between items-end mb-0.5">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Sent
        </span>
        <span
          className={cn(
            "text-xs font-mono font-bold",
            sentiment > 60
              ? "text-emerald-500"
              : sentiment < 40
              ? "text-rose-500"
              : "text-muted-foreground"
          )}
        >
          {sentiment}%
        </span>
      </div>
      <div className="h-0.5 w-full bg-muted/30 rounded-full overflow-hidden flex">
        <div
          className={cn(
            "h-full transition-all duration-500",
            sentiment > 50 ? "bg-emerald-500" : "bg-rose-500"
          )}
          style={{ width: `${sentiment}%` }}
        />
      </div>
    </div>
  );

  return (
    <Card
      className="h-full bg-card border-2 border-white/20 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/20 shrink-0">
        <h3 className="font-semibold text-xs tracking-tight text-foreground">{data.title}</h3>
        <span className="text-[9px] font-medium text-muted-foreground border border-border/20 px-1.5 py-0.5 rounded bg-muted/5">
          {data.activeMonth}
        </span>
      </div>

      <CardContent className="flex-1 p-0 grid grid-cols-10 h-full min-h-0 overflow-hidden">
        {/* Left Column: Gainers */}
        <div className="col-span-3 border-r border-white/20 p-1.5 flex flex-col gap-0.5 overflow-hidden">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 px-1">
            Gainers
          </p>
          <div className="space-y-0.5 flex-1 overflow-hidden">
            {data.winners.map((item) => (
              <TickerRow key={item.ticker} item={item} isWinner={true} />
            ))}
          </div>
          <RVolIndicator rvol={data.rvol} />
        </div>

        {/* Middle Column: Losers */}
        <div className="col-span-3 border-r border-white/20 p-1.5 flex flex-col gap-0.5 overflow-hidden">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 px-1">
            Losers
          </p>
          <div className="space-y-0.5 flex-1 overflow-hidden">
            {data.losers.map((item) => (
              <TickerRow key={item.ticker} item={item} isWinner={false} />
            ))}
          </div>
          <SentimentIndicator sentiment={data.sentiment} />
        </div>

        {/* Right Column: Details */}
        <div className="col-span-4 p-3 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-xl font-bold tracking-tight">{selectedTicker.ticker}</h2>
            </div>
            <div className="mb-0.5">
              <span className="text-3xl font-mono font-medium tracking-tighter">
                {formatNumber(selectedTicker.price)}
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium mb-4",
                selectedTicker.change >= 0 ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {selectedTicker.change >= 0 ? "↑" : "↓"} {Math.abs(selectedTicker.change)}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Vol
              </span>
              <span className="text-sm font-mono">{formatVolume(selectedTicker.stats.volume)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Open
              </span>
              <span className="text-sm font-mono">{formatNumber(selectedTicker.stats.open)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                High
              </span>
              <span className="text-sm font-mono">{formatNumber(selectedTicker.stats.high)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Low
              </span>
              <span className="text-sm font-mono">{formatNumber(selectedTicker.stats.low)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
