"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";

interface AssetClassSectionProps {
  title: string;
  tickers: string[];
}

export function AssetClassSection({ title, tickers }: AssetClassSectionProps) {
  const { data } = useRealtime(tickers);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  // Sort tickers by absolute change percent to find top movers
  const sortedTickers = [...tickers]
    .map((symbol) => {
      const update = data[symbol];
      return {
        symbol,
        changePercent: update?.changePercent || 0,
        price: update?.price || 0,
        volume: update?.volume || 0,
      };
    })
    .sort((a, b) => b.changePercent - a.changePercent);

  const winners = sortedTickers.filter((t) => t.changePercent > 0).slice(0, 3);
  const losers = sortedTickers
    .filter((t) => t.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent) // Sort by most negative
    .slice(0, 3);

  // Default to first ticker if none selected
  const activeTickerSymbol = selectedTicker || tickers[0];
  const activeTickerData = data[activeTickerSymbol];

  return (
    <div className="glass-panel rounded-xl p-6 flex flex-col h-full min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold font-space tracking-tight">{title}</h3>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 gap-6">
        {/* Winners / Losers List */}
        <div className="flex-1 flex gap-4 border-r border-white/5 pr-6">
          {/* Winners */}
          <div className="flex-1 space-y-3">
            <div className="text-xs font-mono text-muted-foreground uppercase mb-2">
              Top Gainers
            </div>
            {winners.map((t) => (
              <TickerItem
                key={t.symbol}
                symbol={t.symbol}
                price={t.price}
                changePercent={t.changePercent}
                isPositive={true}
                onClick={() => setSelectedTicker(t.symbol)}
                isActive={activeTickerSymbol === t.symbol}
              />
            ))}
            {winners.length === 0 && (
              <div className="text-xs text-muted-foreground italic py-2">
                No gainers yet
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-white/5" />

          {/* Losers */}
          <div className="flex-1 space-y-3">
            <div className="text-xs font-mono text-muted-foreground uppercase mb-2">
              Top Losers
            </div>
            {losers.map((t) => (
              <TickerItem
                key={t.symbol}
                symbol={t.symbol}
                price={t.price}
                changePercent={t.changePercent}
                isPositive={false}
                onClick={() => setSelectedTicker(t.symbol)}
                isActive={activeTickerSymbol === t.symbol}
              />
            ))}
            {losers.length === 0 && (
              <div className="text-xs text-muted-foreground italic py-2">
                No losers yet
              </div>
            )}
          </div>
        </div>

        {/* Ticker Detail */}
        <div className="w-[180px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold font-space text-lg">
                {activeTickerSymbol}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                DEC25
              </span>
            </div>
            <div className="text-2xl font-mono font-medium tracking-tight">
              {activeTickerData?.price.toFixed(2) || "---"}
            </div>
            <div
              className={cn(
                "text-sm font-mono flex items-center gap-1 mt-1",
                (activeTickerData?.changePercent || 0) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              )}
            >
              {(activeTickerData?.changePercent || 0) >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(activeTickerData?.changePercent || 0).toFixed(2)}%
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Vol</span>
              <span className="font-mono">
                {activeTickerData?.volume.toLocaleString() || "-"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Open</span>
              <span className="font-mono">
                {(activeTickerData?.price || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">High</span>
              <span className="font-mono">
                {((activeTickerData?.price || 0) * 1.01).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Low</span>
              <span className="font-mono">
                {((activeTickerData?.price || 0) * 0.99).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TickerItem({
  symbol,
  price,
  changePercent,
  isPositive,
  onClick,
  isActive,
}: {
  symbol: string;
  price: number;
  changePercent: number;
  isPositive: boolean;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full text-left p-2 rounded-md transition-colors border border-transparent",
        isActive ? "bg-white/10 border-white/10" : "hover:bg-white/5"
      )}
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">{symbol}</span>
        <span
          className={cn(
            "text-xs font-mono",
            isPositive ? "text-green-500" : "text-red-500"
          )}
        >
          {changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="text-xs text-muted-foreground font-mono mt-0.5">
        {price.toFixed(2)}
      </div>
    </motion.button>
  );
}
