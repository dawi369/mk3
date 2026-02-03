"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetClassData, MarketMover } from "@/components/terminal/_shared/mock-data";
import { cn } from "@/lib/utils";
// import { Sparkline } from "@/components/terminal/views/terminal/sparkline";
// import { MonthSelector } from "@/components/terminal/views/terminal/month-selector";
import { filterByMonth, extractRoot } from "@/lib/month-utils";
import { BorderTrail } from "@/components/ui/border-trail";
import { useTickerModal } from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { useFrontMonth } from "@/providers/front-month-provider";
import { RefreshCw } from "lucide-react";

interface TerminalCardProps {
  data: AssetClassData;
  onClick?: () => void;
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

const TickerRow = React.memo(
  ({
    item,
    isWinner,
    isSelected,
    tickerIsRolling,
    onSelect,
    onOpen,
  }: {
    item: MarketMover;
    isWinner: boolean;
    isSelected: boolean;
    tickerIsRolling: boolean;
    onSelect: (ticker: string) => void;
    onOpen: (item: MarketMover) => void;
  }) => {
    return (
      <div
        className={cn(
          "flex flex-col py-1 px-1.5 rounded cursor-pointer transition-colors w-full",
          isSelected ? "bg-muted/50" : "hover:bg-muted/20"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (isSelected) {
            onOpen(item);
          } else {
            onSelect(item.ticker);
          }
        }}
      >
        <div className="flex items-center justify-between w-full gap-1">
          <div className="flex items-center gap-1.5 w-full">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm tracking-tight">{item.ticker}</span>
              {tickerIsRolling && <RefreshCw className="h-2.5 w-2.5 text-white" />}
            </div>
            <span
              className={cn(
                "text-xs font-mono font-medium ml-auto",
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
  }
);

TickerRow.displayName = "TickerRow";

const ScrollableList = React.memo(
  ({
    items,
    isWinner,
    selectedTickerId,
    isRolling,
    onSelect,
    onOpen,
  }: {
    items: MarketMover[];
    isWinner: boolean;
    selectedTickerId: string | undefined;
    isRolling: (root: string) => boolean;
    onSelect: (ticker: string) => void;
    onOpen: (item: MarketMover) => void;
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTopBlur, setShowTopBlur] = useState(false);
    const [showBottomBlur, setShowBottomBlur] = useState(true);

    const handleScroll = useCallback(() => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

      setShowTopBlur(scrollTop > 0);
      setShowBottomBlur(scrollTop + clientHeight < scrollHeight - 1);
    }, []);

    useEffect(() => {
      const element = scrollRef.current;
      if (element) {
        handleScroll();
      }
    }, [items, handleScroll]);

    return (
      <div className="relative flex-1 group/list">
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
            <TickerRow
              key={item.ticker}
              item={item}
              isWinner={isWinner}
              isSelected={selectedTickerId === item.ticker}
              tickerIsRolling={isRolling(extractRoot(item.ticker))}
              onSelect={onSelect}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
    );
  }
);

ScrollableList.displayName = "ScrollableList";

const RVolIndicator = React.memo(({ rvol }: { rvol: number }) => (
  <div className="mt-auto pt-0.5 px-1.5">
    <div className="flex justify-between items-end mb-0">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        RVol
      </span>
      <span
        className={cn(
          "text-xs font-mono font-bold",
          rvol > 1.2 ? "text-amber" : "text-muted-foreground"
        )}
      >
        {rvol.toFixed(2)}x
      </span>
    </div>
    <div className="h-0.5 w-full bg-muted/30 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full", rvol > 1.2 ? "bg-amber" : "bg-muted-foreground/50")}
        style={{ width: `${Math.min(rvol * 50, 100)}%` }}
      />
    </div>
  </div>
));

RVolIndicator.displayName = "RVolIndicator";

const SentimentIndicator = React.memo(({ sentiment }: { sentiment: number }) => (
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
));

SentimentIndicator.displayName = "SentimentIndicator";

const TerminalCardSkeleton = React.memo(({ title }: { title: string }) => (
  <Card className="h-full bg-card border-2 border-white/20 shadow-sm flex flex-col overflow-hidden">
    <div className="flex items-center justify-between px-2 h-2 shrink-0">
      <h3 className="font-semibold text-base tracking-tight text-foreground leading-none -mt-5">
        {title}
      </h3>
      <div className="h-5 w-20 bg-muted animate-pulse rounded -mt-5" />
    </div>

    <CardContent className="flex-1 p-0 grid grid-cols-[1fr_1fr_1.4fr] h-full min-h-0 opacity-50">
      <div className="border-r border-white/20 p-1 -mt-6 flex flex-col gap-2 overflow-hidden">
        <div className="h-3 w-12 bg-muted animate-pulse rounded mb-1 mx-1" />
        <div className="space-y-2 px-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
      <div className="border-r border-white/20 p-1 -mt-6 flex flex-col gap-2 overflow-hidden">
        <div className="h-3 w-12 bg-muted animate-pulse rounded mb-1 mx-1" />
        <div className="space-y-2 px-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
      <div className="p-3 -mt-6 flex flex-col justify-between overflow-hidden">
        <div className="space-y-4">
          <div className="h-6 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-full bg-muted animate-pulse rounded my-4" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-full bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
));

TerminalCardSkeleton.displayName = "TerminalCardSkeleton";

export const TerminalCard = React.memo(({ data, onClick }: TerminalCardProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("Active");
  const [selectedTickerId, setSelectedTickerId] = useState<string | undefined>(undefined);
  const { open: openTickerModal } = useTickerModal();
  const { getFrontMonth, isRolling } = useFrontMonth();

  // Filter tickers by selected month
  const filteredWinners = useMemo(() => {
    const tickers = data.winners.map((w) => w.ticker);
    const filtered = filterByMonth(tickers, selectedMonth, getFrontMonth);
    return data.winners.filter((w) => filtered.includes(w.ticker));
  }, [data.winners, selectedMonth, getFrontMonth]);

  const filteredLosers = useMemo(() => {
    const tickers = data.losers.map((l) => l.ticker);
    const filtered = filterByMonth(tickers, selectedMonth, getFrontMonth);
    return data.losers.filter((l) => filtered.includes(l.ticker));
  }, [data.losers, selectedMonth, getFrontMonth]);

  const allTickers = useMemo(
    () => [...filteredWinners, ...filteredLosers],
    [filteredWinners, filteredLosers]
  );

  // Auto-select first ticker when selection is undefined or not in filtered list
  const selectedTicker = useMemo(() => {
    const current = allTickers.find((t) => t.ticker === selectedTickerId);
    if (!current && allTickers.length > 0) {
      // Use effect-like logic inside useMemo is discouraged, but we need stable selection
      // However, we'll just return the first one and let the state catch up if needed
      // or set it in a useEffect.
      return allTickers[0];
    }
    return current || allTickers[0];
  }, [allTickers, selectedTickerId]);

  // Sync state if selectedTickerId is invalid
  useEffect(() => {
    if (allTickers.length > 0 && !allTickers.find((t) => t.ticker === selectedTickerId)) {
      setSelectedTickerId(allTickers[0].ticker);
    }
  }, [allTickers, selectedTickerId]);

  const handleTickerSelect = useCallback((ticker: string) => {
    setSelectedTickerId(ticker);
  }, []);

  const handleTickerOpen = useCallback(
    (item: MarketMover) => {
      openTickerModal(item);
    },
    [openTickerModal]
  );

  if (!selectedTicker) {
    return <TerminalCardSkeleton title={data.title} />;
  }

  return (
    <Card
      className="h-full w-full bg-card border-2 border-white/20 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 h-2 shrink-0">
        <h3 className="font-semibold text-base tracking-tight text-foreground leading-none -mt-5">
          {data.title}
        </h3>
        {/* <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} /> */}
      </div>

      <CardContent className="flex-1 p-0 grid grid-cols-[1fr_1fr_1.4fr] min-h-0">
        {/* Left Column: Gainers */}
        <div className="border-r border-white/20 p-1 -mt-6 flex flex-col gap-0 overflow-hidden">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 px-1">
            Gainers
          </p>
          <ScrollableList
            items={filteredWinners}
            isWinner={true}
            selectedTickerId={selectedTickerId}
            isRolling={isRolling}
            onSelect={handleTickerSelect}
            onOpen={handleTickerOpen}
          />
          {/* <RVolIndicator rvol={data.rvol} /> */}
        </div>

        {/* Middle Column: Losers */}
        <div className="border-r border-white/20 p-1 -mt-6 flex flex-col gap-0 overflow-hidden">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 px-1">
            Losers
          </p>
          <ScrollableList
            items={filteredLosers}
            isWinner={false}
            selectedTickerId={selectedTickerId}
            isRolling={isRolling}
            onSelect={handleTickerSelect}
            onOpen={handleTickerOpen}
          />
          <SentimentIndicator sentiment={data.sentiment} />
        </div>

        {/* Right Column: Details */}
        <div className="p-3 -mt-6 flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col">
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
              {selectedTicker.change >= 0 ? "↑" : "↓"} {Math.abs(selectedTicker.change).toFixed(2)}%
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center py-1">
            {/* <Sparkline
              data={selectedTicker.sparklineData}
              width={140}
              height={40}
              color={selectedTicker.change >= 0 ? "#10b981" : "#f43f5e"}
            /> */}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Vol
              </span>
              <span className="text-xs font-mono">{formatVolume(selectedTicker.stats.volume)}</span>
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
  );
});

TerminalCard.displayName = "TerminalCard";
