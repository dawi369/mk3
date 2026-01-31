"use client";

import React from "react";
import { TrendingUp, Brain, FlaskConical, History, BarChart3, Zap } from "lucide-react";
import Image from "next/image";

import { NEXT_PUBLIC_MASSIVE_API_KEY } from "@/config/env";
import { useEffect, useState } from "react";

// Hook to preload market status
export const useMarketStatus = () => {
  const [marketStatus, setMarketStatus] = useState<string>("open");

  useEffect(() => {
    const fetchMarketStatus = async () => {
      try {
        const response = await fetch(
          `https://api.massive.com/futures/vX/market-status?product_code=ES&limit=10&apiKey=${NEXT_PUBLIC_MASSIVE_API_KEY}`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0 && data.results[0].market_event) {
          setMarketStatus(data.results[0].market_event);
        } else {
          setMarketStatus("open");
        }
      } catch (error) {
        console.error("Failed to fetch market status:", error);
        setMarketStatus("open");
      }
    };

    fetchMarketStatus();
  }, []);

  return marketStatus;
};

export const FuturesCard = ({ marketStatus = "open" }: { marketStatus?: string }) => {
  const isMarketOpen = marketStatus.toLowerCase() === "open";

  return (
    <div className="w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-950 border border-neutral-800">
         <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-primary opacity-20" />
         </div>
         <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-neutral-950 to-transparent">
             <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isMarketOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}/>
                 <span className={`text-[10px] font-mono ${isMarketOpen ? "text-green-500" : "text-red-500"} uppercase`}>
                   MARKET {marketStatus}
                 </span>
             </div>
         </div>
      </div>
      <div className="my-4 flex flex-col gap-2">
        <p className="text-lg font-bold flex items-center justify-center gap-2">
          Futures Contracts
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Trade contracts for indices, currencies, commodities, and more.
          Direct market access with crisp visuals.
        </p>
      </div>
    </div>
  );
};

export const SentimentCard = () => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
               <div className="p-1.5 rounded-md bg-green-500/10 border border-green-500/20">
                   <BarChart3 className="w-4 h-4 text-green-500" />
               </div>
               <span className="text-sm font-semibold">Bullish</span>
          </div>
          <span className="text-xs font-mono text-green-500">+12.4%</span>
      </div>
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-green-500 w-[75%]" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold">Contextual Sentiment</p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Real-time aggregated sentiment analysis from news, social media, and
          institutional order flow.
        </p>
      </div>
    </div>
  );
};

export const LabsCard = () => {
  return (
    <div className="w-full">
      <div className="relative w-full aspect-2/1 rounded-md overflow-hidden bg-neutral-950 border border-neutral-800 mb-3 flex items-center justify-center group">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
         <Brain className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" />
         <FlaskConical className="w-4 h-4 text-purple-400 absolute bottom-2 right-2 opacity-50" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold flex items-center justify-center gap-2">
          AI Labs
          <span className="px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 uppercase">Beta</span>
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Access experimental features powered by the best deep learning models.
        </p>
      </div>
    </div>
  );
};

export const BacktestingCard = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-6 gap-3">
        <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-900">
            <History className="w-6 h-6 text-neutral-500" />
        </div>
        <div className="text-center space-y-1">
             <p className="text-lg font-bold">Precision Backtesting</p>
             <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Coming Soon</p>
        </div>
    </div>
  );
};
