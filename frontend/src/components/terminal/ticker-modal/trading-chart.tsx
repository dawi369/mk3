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
  lineData?: LineData<Time>[];
  comparisons?: string[];
  comparisonData?: Record<string, LineData<Time>[]>;
  showComparisons?: boolean;
  fitKey?: string;
  className?: string;
}

const emptyCandles: CandlestickData<Time>[] = [];
const emptyLines: LineData<Time>[] = [];

export function TradingChart({
  ticker,
  data,
  lineData,
  comparisons = [],
  comparisonData,
  showComparisons = true,
  fitKey,
  className,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const primaryCandleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const primaryLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const comparisonSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const lastFitKeyRef = useRef<string | null>(null);

  const useLinePrimary = lineData !== undefined;

  // Initialize chart
  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      primaryCandleRef.current = null;
      primaryLineRef.current = null;
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

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: SYMBOL_COLORS[0],
      downColor: "#f43f5e",
      borderUpColor: SYMBOL_COLORS[0],
      borderDownColor: "#f43f5e",
      wickUpColor: SYMBOL_COLORS[0],
      wickDownColor: "#f43f5e",
    });
    primaryCandleRef.current = candlestickSeries;

    const lineSeries = chart.addSeries(LineSeries, {
      color: SYMBOL_COLORS[0],
      lineWidth: 2,
    });
    primaryLineRef.current = lineSeries;

    candlestickSeries.setData(emptyCandles);
    lineSeries.setData(emptyLines);

    chart.timeScale().fitContent();
  }, []);

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
        primaryCandleRef.current = null;
        primaryLineRef.current = null;
        comparisonSeriesRef.current.clear();
      }
    };
  }, [initChart]);

  // Update data when ticker changes
  useEffect(() => {
    if (!chartRef.current) return;

    if (useLinePrimary) {
      primaryCandleRef.current?.setData(emptyCandles);
      primaryLineRef.current?.setData(lineData ?? emptyLines);
    } else {
      primaryLineRef.current?.setData(emptyLines);
      primaryCandleRef.current?.setData(data ?? emptyCandles);
    }

    const nextFitKey = fitKey ?? `${ticker}:${useLinePrimary ? "line" : "candle"}`;
    if (lastFitKeyRef.current !== nextFitKey) {
      chartRef.current.timeScale().fitContent();
      lastFitKeyRef.current = nextFitKey;
    }
  }, [ticker, data, lineData, useLinePrimary, fitKey]);

  // Handle comparison symbols
  useEffect(() => {
    if (!chartRef.current) return;

    const activeSymbols = showComparisons ? comparisons : [];
    const currentSymbols = new Set(activeSymbols);
    const existingSymbols = new Set(comparisonSeriesRef.current.keys());

    for (const symbol of existingSymbols) {
      if (!currentSymbols.has(symbol)) {
        const series = comparisonSeriesRef.current.get(symbol);
        if (series) {
          chartRef.current.removeSeries(series);
          comparisonSeriesRef.current.delete(symbol);
        }
      }
    }

    for (let i = 0; i < activeSymbols.length; i++) {
      const symbol = activeSymbols[i];
      let series = comparisonSeriesRef.current.get(symbol);

      if (!series) {
        const colorIndex = i + 1;
        series = chartRef.current.addSeries(LineSeries, {
          color: SYMBOL_COLORS[colorIndex % SYMBOL_COLORS.length],
          lineWidth: 2,
        });
        comparisonSeriesRef.current.set(symbol, series);
      }

      const seriesData = comparisonData?.[symbol] ?? emptyLines;
      series.setData(seriesData);
    }
  }, [comparisons, comparisonData, showComparisons]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
