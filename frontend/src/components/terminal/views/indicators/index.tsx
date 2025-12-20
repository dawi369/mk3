"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useHeader } from "@/components/terminal/layout/header-provider";
import { IndicatorsNav } from "@/components/terminal/views/indicators/indicators-nav";
import { OverviewCards } from "@/components/terminal/views/indicators/overview-cards";
import { StrategyCard } from "@/components/terminal/views/indicators/strategy-card";
import { MarketStatusGauges } from "@/components/terminal/views/indicators/market-status-gauges";
import { IndicatorLevels } from "@/components/terminal/views/indicators/indicator-levels";
import { mockIndicatorsData } from "./mock-indicators-data";

export function IndicatorsView() {
  const { setNavContent } = useHeader();
  const [timeframe, setTimeframe] = useState("1H");
  const [asset, setAsset] = useState("ES");

  const currentData = mockIndicatorsData[asset] || mockIndicatorsData["ES"];

  // Memoize nav content
  const navContent = useMemo(
    () => (
      <IndicatorsNav
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        asset={asset}
        onAssetChange={setAsset}
        onSearchClick={() => console.log("Open search")}
      />
    ),
    [timeframe, asset]
  );

  useEffect(() => {
    setNavContent(navContent);
    return () => setNavContent(null);
  }, [setNavContent, navContent]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-6 pb-24 gap-6">
      {/* Overview Cards at the top */}
      <OverviewCards />

      {/* Main Dashboard Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Hero Area: The Play (Strategy) - 5 columns */}
        <div className="col-span-12 lg:col-span-5 h-full">
          <StrategyCard strategy={currentData.strategy} />
        </div>

        {/* Gauges & Status Area - 3 columns */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 h-full">
          <MarketStatusGauges
            trendStrength={currentData.trendStrength}
            volatilityRegime={currentData.volatilityRegime}
            volatilityValue={currentData.volatilityValue}
            momentum={currentData.momentum}
          />
        </div>

        {/* Levels Area - 4 columns */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 h-full bg-neutral-900/40 border border-white/5 rounded-4xl p-6 overflow-y-auto custom-scrollbar">
          <IndicatorLevels levels={currentData.levels} />
        </div>
      </div>
    </div>
  );
}
