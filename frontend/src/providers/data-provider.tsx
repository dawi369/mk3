"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import type { Bar } from "@/types/bar.types.js";
import type { MarketDataMessage, ConnectionStatus } from "@/types/api.types.js";
import { HUB_API_URL, WS_URL } from "@/config/env.js";

/**
 * Data provider state interface
 */
interface DataProviderState {
  // Connection status
  connectionStatus: ConnectionStatus;
  
  // Data storage
  historicalData: Map<string, Bar[]>; // TimescaleDB data (previous day and older)
  todayData: Map<string, Bar[]>; // Redis snapshot data (today)
  liveData: Map<string, Bar>; // Latest live bar per symbol
  
  // Methods
  getCombinedBars: (symbol: string) => Bar[];
  fetchHistoricalData: (symbol: string, startMs: number, endMs: number) => Promise<Bar[]>;
  refreshTodayData: (symbol: string) => Promise<void>;
  connect: () => void;
  disconnect: () => void;
  
  // Stats
  stats: {
    totalHistoricalBars: number;
    totalTodayBars: number;
    symbolsWithData: number;
  };
}

const DataProviderContext = createContext<DataProviderState | null>(null);

/**
 * Custom hook to access data provider
 */
export function useDataProvider(): DataProviderState {
  const context = useContext(DataProviderContext);
  if (!context) {
    throw new Error("useDataProvider must be used within DataProvider");
  }
  return context;
}

/**
 * Data Provider Component
 * 
 * Manages:
 * - WebSocket connection for live market data (auto-reconnect with exponential backoff)
 * - Historical data from TimescaleDB (previous day and older)
 * - Today's data from Redis (via WebSocket snapshot)
 * - Live updates from WebSocket stream
 * - Data combination for charting (historical + today + live)
 * 
 * Usage:
 * ```tsx
 * // Wrap your app with DataProvider
 * <DataProvider>
 *   <App />
 * </DataProvider>
 * 
 * // In components:
 * const { getCombinedBars, fetchHistoricalData, connectionStatus } = useDataProvider();
 * 
 * // Fetch historical data for a symbol
 * useEffect(() => {
 *   const start = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
 *   const end = Date.now();
 *   fetchHistoricalData("ESZ25", start, end);
 * }, []);
 * 
 * // Get combined bars for charting
 * const bars = getCombinedBars("ESZ25");
 * ```
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [historicalData, setHistoricalData] = useState<Map<string, Bar[]>>(new Map());
  const [todayData, setTodayData] = useState<Map<string, Bar[]>>(new Map());
  const [liveData, setLiveData] = useState<Map<string, Bar>>(new Map());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  
  const MAX_RECONNECT_ATTEMPTS = 10;
  const INITIAL_RECONNECT_DELAY = 500;
  const MAX_RECONNECT_DELAY = 20000;

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
      MAX_RECONNECT_DELAY
    );
    return delay;
  }, []);

  /**
   * Fetch historical data from TimescaleDB via Hub API
   */
  const fetchHistoricalData = useCallback(async (
    symbol: string,
    startMs: number,
    endMs: number
  ): Promise<Bar[]> => {
    try {
      const response = await fetch(
        `${HUB_API_URL}/bars/history/${encodeURIComponent(symbol)}?start=${startMs}&end=${endMs}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          // No historical data available, that's okay
          return [];
        }
        throw new Error(`Failed to fetch historical data: ${response.statusText}`);
      }
      
      const data = await response.json();
      const bars: Bar[] = Array.isArray(data.bars) ? data.bars : [];
      
      // Store historical data
      setHistoricalData((prev) => {
        const newMap = new Map(prev);
        newMap.set(symbol, bars);
        return newMap;
      });
      
      return bars;
    } catch (error) {
      console.error(`[DataProvider] Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }, []);

  /**
   * Fetch today's data from Hub API (Redis)
   */
  const refreshTodayData = useCallback(async (symbol: string): Promise<void> => {
    try {
      const response = await fetch(`${HUB_API_URL}/bars/today/${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No data for today yet, that's okay
          setTodayData((prev) => {
            const newMap = new Map(prev);
            newMap.set(symbol, []);
            return newMap;
          });
          return;
        }
        throw new Error(`Failed to fetch today's data: ${response.statusText}`);
      }
      
      const data = await response.json();
      const bars: Bar[] = Array.isArray(data.bars) ? data.bars : [];
      
      // Sort by timestamp
      bars.sort((a, b) => a.startTime - b.startTime);
      
      setTodayData((prev) => {
        const newMap = new Map(prev);
        newMap.set(symbol, bars);
        return newMap;
      });
    } catch (error) {
      console.error(`[DataProvider] Error fetching today's data for ${symbol}:`, error);
    }
  }, []);

  /**
   * Get combined bars for a symbol (historical + today + live)
   * Sorted by timestamp, ready for charting
   */
  const getCombinedBars = useCallback((symbol: string): Bar[] => {
    const historical = historicalData.get(symbol) || [];
    const today = todayData.get(symbol) || [];
    const live = liveData.get(symbol);
    
    // Combine all bars
    const allBars: Bar[] = [...historical, ...today];
    
    // Add live bar if it exists and is newer than the last bar
    if (live) {
      const lastBar = allBars[allBars.length - 1];
      if (!lastBar || live.endTime > lastBar.endTime) {
        allBars.push(live);
      } else if (lastBar && live.endTime === lastBar.endTime) {
        // Update the last bar with live data
        allBars[allBars.length - 1] = live;
      }
    }
    
    // Sort by timestamp and remove duplicates
    const sorted = allBars.sort((a, b) => a.startTime - b.startTime);
    
    // Remove duplicates based on endTime
    const unique: Bar[] = [];
    const seen = new Set<number>();
    
    for (const bar of sorted) {
      if (!seen.has(bar.endTime)) {
        seen.add(bar.endTime);
        unique.push(bar);
      }
    }
    
    return unique;
  }, [historicalData, todayData, liveData]);

  /**
   * Handle WebSocket message
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: MarketDataMessage = JSON.parse(event.data);
      
      if (message.type !== "market_data" || !message.data) {
        return;
      }
      
      const bar = message.data;
      
      if (message.snapshot) {
        // This is snapshot data (today's Redis data)
        setTodayData((prev) => {
          const newMap = new Map(prev);
          const symbol = bar.symbol;
          const existing = newMap.get(symbol) || [];
          
          // Check if this bar already exists
          const exists = existing.some((b) => b.endTime === bar.endTime);
          if (!exists) {
            const updated = [...existing, bar].sort((a, b) => a.startTime - b.startTime);
            newMap.set(symbol, updated);
          }
          
          return newMap;
        });
      } else {
        // This is a live update
        setLiveData((prev) => {
          const newMap = new Map(prev);
          newMap.set(bar.symbol, bar);
          return newMap;
        });
        
        // Also update today's data if this bar is from today
        const barDate = new Date(bar.startTime);
        const today = new Date();
        const isToday =
          barDate.getUTCFullYear() === today.getUTCFullYear() &&
          barDate.getUTCMonth() === today.getUTCMonth() &&
          barDate.getUTCDate() === today.getUTCDate();
        
        if (isToday) {
          setTodayData((prev) => {
            const newMap = new Map(prev);
            const symbol = bar.symbol;
            const existing = newMap.get(symbol) || [];
            
            // Update or add the bar
            const index = existing.findIndex((b) => b.endTime === bar.endTime);
            if (index >= 0) {
              existing[index] = bar;
            } else {
              existing.push(bar);
              existing.sort((a, b) => a.startTime - b.startTime);
            }
            
            newMap.set(symbol, existing);
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error("[DataProvider] Error parsing WebSocket message:", error);
    }
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    isConnectingRef.current = true;
    setConnectionStatus("connecting");
    
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log("[DataProvider] WebSocket connected");
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
      };
      
      ws.onmessage = handleMessage;
      
      ws.onerror = (error) => {
        console.error("[DataProvider] WebSocket error:", error);
        setConnectionStatus("error");
        isConnectingRef.current = false;
      };
      
      ws.onclose = () => {
        console.log("[DataProvider] WebSocket closed");
        setConnectionStatus("disconnected");
        isConnectingRef.current = false;
        wsRef.current = null;
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay();
          reconnectAttemptsRef.current++;
          console.log(
            `[DataProvider] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
          );
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error("[DataProvider] Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("[DataProvider] Error creating WebSocket:", error);
      setConnectionStatus("error");
      isConnectingRef.current = false;
    }
  }, [handleMessage, getReconnectDelay]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionStatus("disconnected");
    reconnectAttemptsRef.current = 0;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Calculate stats
  const stats = {
    totalHistoricalBars: Array.from(historicalData.values()).reduce(
      (sum, bars) => sum + bars.length,
      0
    ),
    totalTodayBars: Array.from(todayData.values()).reduce(
      (sum, bars) => sum + bars.length,
      0
    ),
    symbolsWithData: new Set([
      ...historicalData.keys(),
      ...todayData.keys(),
      ...liveData.keys(),
    ]).size,
  };

  const value: DataProviderState = {
    connectionStatus,
    historicalData,
    todayData,
    liveData,
    getCombinedBars,
    fetchHistoricalData,
    refreshTodayData,
    connect,
    disconnect,
    stats,
  };

  return (
    <DataProviderContext.Provider value={value}>
      {children}
    </DataProviderContext.Provider>
  );
}

