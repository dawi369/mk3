import { create } from "zustand";
import { Bar } from "@/types/common.types";

export interface MarketData {
  [symbol: string]: Bar[];
}

interface MarketState {
  marketData: MarketData;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  handleMarketUpdate: (symbol: string, bar: Bar) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  marketData: {},
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
  handleMarketUpdate: (symbol, newBar) =>
    set((state) => {
      const currentBars = state.marketData[symbol] || [];
      const lastBar = currentBars[currentBars.length - 1];

      // Deduplication/Update logic
      if (lastBar && lastBar.startTime === newBar.startTime) {
        // Update existing bar (e.g. volume update)
        const updatedBars = [...currentBars];
        updatedBars[updatedBars.length - 1] = newBar;
        return {
          marketData: {
            ...state.marketData,
            [symbol]: updatedBars,
          },
        };
      }

      // Out of order safety - simple append for now as backend sends oldest first
      return {
        marketData: {
          ...state.marketData,
          [symbol]: [...currentBars, newBar],
        },
      };
    }),
}));
