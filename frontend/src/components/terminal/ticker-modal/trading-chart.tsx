"use client";

import React, { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  Time,
} from "lightweight-charts";
import { SYMBOL_COLORS } from "@/components/terminal/ticker-modal/ticker-modal-provider";

interface TradingChartProps {
  ticker: string;
  data?: CandlestickData<Time>[];
  comparisons?: string[];
  className?: string;
}

// Generate mock candlestick data for demo purposes
function generateMockData(basePrice: number, count = 100): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  let currentPrice = basePrice;
  const now = Math.floor(Date.now() / 1000);

  for (let i = count; i >= 0; i--) {
    const time = (now - i * 60) as Time;
    const volatility = basePrice * 0.002;
    const open = currentPrice;
    const close = open + (Math.random() - 0.5) * volatility * 2;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;

    data.push({ time, open, high, low, close });
    currentPrice = close;
  }

  return data;
}

// Generate mock line data for comparison symbols
function generateMockLineData(basePrice: number, count = 100): LineData<Time>[] {
  const data: LineData<Time>[] = [];
  let currentPrice = basePrice;
  const now = Math.floor(Date.now() / 1000);

  for (let i = count; i >= 0; i--) {
    const time = (now - i * 60) as Time;
    const volatility = basePrice * 0.003;
    currentPrice = currentPrice + (Math.random() - 0.5) * volatility * 2;
    data.push({ time, value: currentPrice });
  }

  return data;
}

export function TradingChart({ ticker, data, comparisons = [], className }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const primarySeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const comparisonSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  // Initialize chart
  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      primarySeriesRef.current = null;
      comparisonSeriesRef.current.clear();
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255, 255, 255, 0.2)", width: 1, style: 2 },
        horzLine: { color: "rgba(255, 255, 255, 0.2)", width: 1, style: 2 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      handleScroll: { vertTouchDrag: false },
    });

    // Primary candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: SYMBOL_COLORS[0],
      downColor: "#f43f5e",
      borderUpColor: SYMBOL_COLORS[0],
      borderDownColor: "#f43f5e",
      wickUpColor: SYMBOL_COLORS[0],
      wickDownColor: "#f43f5e",
    });

    chartRef.current = chart;
    primarySeriesRef.current = candlestickSeries;

    // Set primary data
    const chartData = data || generateMockData(1000, 100);
    candlestickSeries.setData(chartData);

    chart.timeScale().fitContent();
  }, [data]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (chartRef.current && entries[0]) {
        const { width, height } = entries[0].contentRect;
        chartRef.current.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize chart on mount
  useEffect(() => {
    initChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        primarySeriesRef.current = null;
        comparisonSeriesRef.current.clear();
      }
    };
  }, [initChart]);

  // Update data when ticker changes
  useEffect(() => {
    if (primarySeriesRef.current) {
      const chartData = data || generateMockData(1000, 100);
      primarySeriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [ticker, data]);

  // Handle comparison symbols
  useEffect(() => {
    if (!chartRef.current) return;

    const currentSymbols = new Set(comparisons);
    const existingSymbols = new Set(comparisonSeriesRef.current.keys());

    // Remove series for symbols no longer in comparisons
    for (const symbol of existingSymbols) {
      if (!currentSymbols.has(symbol)) {
        const series = comparisonSeriesRef.current.get(symbol);
        if (series) {
          chartRef.current.removeSeries(series);
          comparisonSeriesRef.current.delete(symbol);
        }
      }
    }

    // Add series for new comparison symbols
    for (let i = 0; i < comparisons.length; i++) {
      const symbol = comparisons[i];
      if (!comparisonSeriesRef.current.has(symbol)) {
        const colorIndex = i + 1; // Skip first color (used by primary)
        const lineSeries = chartRef.current.addSeries(LineSeries, {
          color: SYMBOL_COLORS[colorIndex % SYMBOL_COLORS.length],
          lineWidth: 2,
        });

        // Use mock data for now
        const lineData = generateMockLineData(1000 + (i + 1) * 50, 100);
        lineSeries.setData(lineData);

        comparisonSeriesRef.current.set(symbol, lineSeries);
      }
    }
  }, [comparisons]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
