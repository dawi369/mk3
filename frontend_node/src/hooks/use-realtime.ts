"use client";

import { useState, useEffect } from "react";
import { z } from "zod";

// Schema for ticker updates
export const TickerUpdateSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number(),
  timestamp: z.number(),
});

export type TickerUpdate = z.infer<typeof TickerUpdateSchema>;

// Mock data generator
const generateMockUpdate = (symbol: string): TickerUpdate => {
  const basePrice = 4000 + Math.random() * 1000;
  const change = (Math.random() - 0.5) * 20;
  return {
    symbol,
    price: basePrice,
    change: change,
    changePercent: (change / basePrice) * 100,
    volume: Math.floor(Math.random() * 10000),
    timestamp: Date.now(),
  };
};

export function useRealtime(symbols: string[]) {
  const [data, setData] = useState<Record<string, TickerUpdate>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate connection
    setIsConnected(true);

    // Mock data stream
    const interval = setInterval(() => {
      const updates: Record<string, TickerUpdate> = {};
      symbols.forEach((symbol) => {
        // 30% chance to update each symbol per tick
        if (Math.random() > 0.7) {
          const update = generateMockUpdate(symbol);
          // Validate with Zod
          const result = TickerUpdateSchema.safeParse(update);
          if (result.success) {
            updates[symbol] = result.data;
          } else {
            console.error("Invalid ticker data:", result.error);
          }
        }
      });

      setData((prev) => ({ ...prev, ...updates }));
    }, 1000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [symbols]);

  return { data, isConnected };
}
