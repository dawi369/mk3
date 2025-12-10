"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useHeader } from "@/components/terminal/layout/header-provider";
import { IndicatorsNav } from "@/components/terminal/views/indicators/indicators-nav";
import { OverviewCards } from "@/components/terminal/views/indicators/overview-cards";
import { IndicatorTable } from "@/components/terminal/views/indicators/indicator-table";
import { ContextPanel } from "@/components/terminal/views/indicators/context-panel";

export function IndicatorsView() {
  const { setNavContent } = useHeader();
  const [timeframe, setTimeframe] = useState("1H");
  const [asset, setAsset] = useState("ES");
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  // Memoize nav content to prevent recreating on every state change
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

  // Only set nav content on mount and when navContent changes
  useEffect(() => {
    setNavContent(navContent);
    return () => setNavContent(null);
  }, [setNavContent, navContent]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-4 pb-20 gap-4">
      {/* Top Strip: Overview Cards */}
      <OverviewCards />

      {/* Main Content: Table + Context Panel */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Indicator Table - left, scrollable */}
        <div className="flex-1 min-w-0">
          <IndicatorTable
            asset={asset}
            timeframe={timeframe}
            selectedContract={selectedContract}
            onSelectContract={setSelectedContract}
          />
        </div>

        {/* Context Panel - right */}
        <div className="w-[400px] shrink-0">
          <ContextPanel contract={selectedContract} timeframe={timeframe} />
        </div>
      </div>
    </div>
  );
}
