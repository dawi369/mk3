import { useMemo } from "react";
import { useData } from "@/providers/data-provider";
import {
  ASSET_CLASSES,
  AssetClassId,
  getAssetClassForTicker,
  getTickerDetails,
} from "@/lib/ticker-mapping";
import { AssetClassData, MarketMover } from "@/components/terminal/_shared/mock-data";

export function useTerminalData() {
  const { marketData } = useData();

  const terminalData = useMemo(() => {
    // Initialize data structure for all asset classes
    const dataByClass: Record<AssetClassId, AssetClassData> = {} as any;

    ASSET_CLASSES.forEach((ac) => {
      dataByClass[ac.id] = {
        id: ac.id,
        title: ac.title,
        activeMonth: "DEC 25", // Placeholder, ideally dynamic
        nextMonth: "MAR 26", // Placeholder
        winners: [],
        losers: [],
        rvol: 1.0, // Placeholder
        sentiment: 50, // Placeholder
      };
    });

    // Process all available market data
    Object.entries(marketData).forEach(([ticker, bars]) => {
      if (!bars || bars.length === 0) return;

      const assetClassId = getAssetClassForTicker(ticker);
      if (!assetClassId || !dataByClass[assetClassId]) return;

      const latestBar = bars[bars.length - 1];
      const firstBar = bars[0]; // Using first bar of the session as "open" reference for now

      // Calculate change based on session open (first bar) vs current
      // Ideally we'd use previous day close, but we might not have it in this stream yet
      const openPrice = firstBar.open;
      const currentPrice = latestBar.close;
      const change = ((currentPrice - openPrice) / openPrice) * 100;

      const sparklineData = bars.map((b) => b.close);

      // Limit sparkline points to last 50 for performance/visuals if needed,
      // but Sparkline component handles it.

      const tickerDetails = getTickerDetails(ticker);

      const mover: MarketMover = {
        ticker,
        change,
        price: currentPrice,
        stats: {
          open: latestBar.open,
          high: latestBar.high,
          low: latestBar.low,
          prevClose: openPrice, // Approximation
          volume: latestBar.volume,
        },
        sparklineData,
      };

      if (change >= 0) {
        dataByClass[assetClassId].winners.push(mover);
      } else {
        dataByClass[assetClassId].losers.push(mover);
      }
    });

    // Sort winners and losers
    Object.values(dataByClass).forEach((ac) => {
      ac.winners.sort((a, b) => b.change - a.change); // Descending
      ac.losers.sort((a, b) => a.change - b.change); // Ascending (most negative first)
    });

    // Convert to array in the order of ASSET_CLASSES
    return ASSET_CLASSES.map((ac) => dataByClass[ac.id]);
  }, [marketData]);

  return terminalData;
}
