"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetClassData, MarketMover } from "@/components/terminal/mock-data";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/terminal/sparkline";
import { MonthSelector } from "@/components/terminal/month-selector";
import { filterByMonth } from "@/lib/month-utils";
import { Tilt } from "@/components/ui/tilt";
import { BorderTrail } from "@/components/ui/border-trail";

interface TerminalCardProps {
  data: AssetClassData;
  onClick?: () => void;
}

export function TerminalCard({ data, onClick }: TerminalCardProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("Front");
  const [selectedTickerId, setSelectedTickerId] = useState<string | undefined>(undefined);

  // Filter tickers by selected month
  const filteredWinners = useMemo(() => {
    const tickers = data.winners.map((w) => w.ticker);
    const filtered = filterByMonth(tickers, selectedMonth);
    return data.winners.filter((w) => filtered.includes(w.ticker));
  }, [data.winners, selectedMonth]);

  const filteredLosers = useMemo(() => {
    const tickers = data.losers.map((l) => l.ticker);
    const filtered = filterByMonth(tickers, selectedMonth);
    return data.losers.filter((l) => filtered.includes(l.ticker));
  }, [data.losers, selectedMonth]);

  const allTickers = [...filteredWinners, ...filteredLosers];

  // Auto-select first ticker when selection is undefined or not in filtered list
  const selectedTicker = useMemo(() => {
    const current = allTickers.find((t) => t.ticker === selectedTickerId);
    if (!current && allTickers.length > 0) {
      setSelectedTickerId(allTickers[0].ticker);
      return allTickers[0];
    }
    return current || allTickers[0];
  }, [allTickers, selectedTickerId]);

  if (!selectedTicker) {
    return (
      <Tilt
        rotationFactor={1}
        isRevese={true}
        springOptions={{ stiffness: 400, damping: 25 }}
        className="h-full"
      >
        <Card className="relative h-full bg-card border-2 border-white/20 shadow-sm flex flex-col overflow-hidden">
          <BorderTrail
            className="bg-linear-to-l from-blue-500 via-purple-500 to-pink-500"
            size={80}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "linear",
            }}
          />
          <div className="flex items-center justify-between px-2 h-2 shrink-0">
            <h3 className="font-semibold text-base tracking-tight text-foreground leading-none -mt-5">
              {data.title}
            </h3>
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          </div>
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs animate-pulse">
            Loading...
          </div>
        </Card>
      </Tilt>
    );
  }

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
    const isSelected = selectedTickerId === item.ticker;
    return (
      <div
        className={cn(
          "flex flex-col py-1 px-1.5 rounded cursor-pointer transition-colors w-full",
          isSelected ? "bg-muted/50" : "hover:bg-muted/20"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTickerId(item.ticker);
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
              {item.change.toFixed(2)}%
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{formatNumber(item.price)}</span>
      </div>
    );
  };

  const ScrollableList = ({ items, isWinner }: { items: MarketMover[]; isWinner: boolean }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showTopBlur, setShowTopBlur] = React.useState(false);
    const [showBottomBlur, setShowBottomBlur] = React.useState(true);

    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

      setShowTopBlur(scrollTop > 0);
      setShowBottomBlur(scrollTop + clientHeight < scrollHeight - 1);
    };

    React.useEffect(() => {
      const element = scrollRef.current;
      if (element) {
        handleScroll(); // Check initial state
      }
    }, [items]);

    return (
      <div className="relative flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            "absolute inset-0 overflow-y-auto overflow-x-hidden space-y-0.5",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            showTopBlur &&
              showBottomBlur &&
              "mask-[linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]",
            showTopBlur &&
              !showBottomBlur &&
              "mask-[linear-gradient(to_bottom,transparent,black_12px,black)]",
            !showTopBlur &&
              showBottomBlur &&
              "mask-[linear-gradient(to_bottom,black,black_calc(100%-12px),transparent)]"
          )}
        >
          {items.map((item) => (
            <TickerRow key={item.ticker} item={item} isWinner={isWinner} />
          ))}
        </div>
      </div>
    );
  };

  const RVolIndicator = ({ rvol }: { rvol: number }) => (
    <div className="mt-auto pt-0.5 px-1.5">
      <div className="flex justify-between items-end mb-0">
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
    <div className="mt-auto pt-0.5 px-1.5">
      <div className="flex justify-between items-end mb-0">
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
    <Tilt
      //edit this to 3 or 4 for more rotation
      rotationFactor={1}
      isRevese={true}
      springOptions={{ stiffness: 400, damping: 25 }}
      className="h-full"
    >
      <Card
        className="h-full bg-card border-2 border-white/20 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 h-2 shrink-0">
          <h3 className="font-semibold text-base tracking-tight text-foreground leading-none -mt-5">
            {data.title}
          </h3>
          <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </div>

        <CardContent className="flex-1 p-0 grid grid-cols-[1fr_1fr_1.4fr] h-full min-h-0 overflow-hidden">
          {/* Left Column: Gainers */}
          <div className="border-r border-white/20 p-1 -mt-4 flex flex-col gap-0 overflow-hidden">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 px-1">
              Gainers
            </p>
            <ScrollableList items={filteredWinners} isWinner={true} />
            <RVolIndicator rvol={data.rvol} />
          </div>

          {/* Middle Column: Losers */}
          <div className="border-r border-white/20 p-1 -mt-4 flex flex-col gap-0 overflow-hidden">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 px-1">
              Losers
            </p>
            <ScrollableList items={filteredLosers} isWinner={false} />
            <SentimentIndicator sentiment={data.sentiment} />
          </div>

          {/* Right Column: Details */}
          <div className="p-3 -mt-4 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-xl font-bold tracking-tight">{selectedTicker.ticker}</h2>
              </div>
              <div className="mb-0.5">
                <span className="text-2xl font-mono font-medium tracking-tighter">
                  {formatNumber(selectedTicker.price)}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium mb-2",
                  selectedTicker.change >= 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {selectedTicker.change >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(selectedTicker.change).toFixed(2)}%
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center py-1">
              <Sparkline
                data={selectedTicker.sparklineData}
                width={140}
                height={40}
                color={selectedTicker.change >= 0 ? "#10b981" : "#f43f5e"}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Vol
                </span>
                <span className="text-xs font-mono">
                  {formatVolume(selectedTicker.stats.volume)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Open
                </span>
                <span className="text-xs font-mono">{formatNumber(selectedTicker.stats.open)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  High
                </span>
                <span className="text-xs font-mono">{formatNumber(selectedTicker.stats.high)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Low
                </span>
                <span className="text-xs font-mono">{formatNumber(selectedTicker.stats.low)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tilt>
  );
}
