"use client";

import React, { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  IChartApi,
  ISeriesApi,
  LineStyle,
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
  visibleBars?: number;
  secondsVisible?: boolean;
  sessionLevels?: { high?: number | null; low?: number | null; last?: number | null };
  className?: string;
}

const emptyCandles: CandlestickData<Time>[] = [];
const emptyLines: LineData<Time>[] = [];
type PriceLineRef = ReturnType<ISeriesApi<"Line">["createPriceLine"]>;

export function TradingChart({
  ticker,
  data,
  lineData,
  comparisons = [],
  comparisonData,
  showComparisons = true,
  fitKey,
  visibleBars = 200,
  secondsVisible = false,
  sessionLevels,
  className,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const primaryCandleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const primaryLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const comparisonSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const lastFitKeyRef = useRef<string | null>(null);
  const lastTickerRef = useRef<string | null>(null);
  const priceLinesRef = useRef<{
    high?: PriceLineRef;
    low?: PriceLineRef;
    last?: PriceLineRef;
    seriesType?: "line" | "candle";
  }>({});

  const useLinePrimary = lineData !== undefined;
  const rightOffset = Math.max(2, Math.floor(visibleBars * 0.2));

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
      priceLineVisible: false,
      lastValueVisible: false,
    });
    primaryCandleRef.current = candlestickSeries;

    const lineSeries = chart.addSeries(LineSeries, {
      color: SYMBOL_COLORS[0],
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    primaryLineRef.current = lineSeries;

    candlestickSeries.setData(emptyCandles);
    lineSeries.setData(emptyLines);

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

    chartRef.current.applyOptions({
      timeScale: {
        timeVisible: true,
        secondsVisible,
        rightOffset,
      },
    });

    if (useLinePrimary) {
      primaryCandleRef.current?.setData(emptyCandles);
      primaryLineRef.current?.setData(lineData ?? emptyLines);
    } else {
      primaryLineRef.current?.setData(emptyLines);
      primaryCandleRef.current?.setData(data ?? emptyCandles);
    }

    const nextFitKey = fitKey ?? `${ticker}:${useLinePrimary ? "line" : "candle"}`;
    const length = useLinePrimary ? lineData?.length ?? 0 : data?.length ?? 0;
    const clampedVisible = Math.max(10, visibleBars);
    const expectedTo = length > 0 ? length - 1 + rightOffset : 0;

    if (lastFitKeyRef.current !== nextFitKey && length > 0) {
      const from = Math.max(0, expectedTo - clampedVisible);
      const to = expectedTo;
      if (from <= to) {
        chartRef.current.timeScale().setVisibleLogicalRange({ from, to });
      }
      lastFitKeyRef.current = nextFitKey;
      return;
    }

    if (length > 0) {
      const range = chartRef.current.timeScale().getVisibleLogicalRange();
      if (!range) return;
      const distance = expectedTo - range.to;
      const isNearRight = distance <= rightOffset + 1 && distance >= -1;
      if (isNearRight) {
        const from = Math.max(0, expectedTo - clampedVisible);
        chartRef.current.timeScale().setVisibleLogicalRange({ from, to: expectedTo });
      }
    }
  }, [ticker, data, lineData, useLinePrimary, fitKey, visibleBars, secondsVisible, rightOffset]);

  const clearPriceLines = useCallback(() => {
    const seriesType = priceLinesRef.current.seriesType;
    const series =
      seriesType === "line"
        ? primaryLineRef.current
        : seriesType === "candle"
          ? primaryCandleRef.current
          : null;
    if (!series) return;
    const { high, low, last } = priceLinesRef.current;
    if (high) series.removePriceLine(high);
    if (low) series.removePriceLine(low);
    if (last) series.removePriceLine(last);
    priceLinesRef.current.high = undefined;
    priceLinesRef.current.low = undefined;
    priceLinesRef.current.last = undefined;
  }, []);

  useEffect(() => {
    const activeSeries = useLinePrimary ? primaryLineRef.current : primaryCandleRef.current;
    const nextType = useLinePrimary ? "line" : "candle";

    if (lastTickerRef.current !== ticker) {
      clearPriceLines();
      priceLinesRef.current.seriesType = nextType;
      lastTickerRef.current = ticker;
    }

    if (priceLinesRef.current.seriesType && priceLinesRef.current.seriesType !== nextType) {
      clearPriceLines();
      priceLinesRef.current.seriesType = nextType;
    }

    if (!priceLinesRef.current.seriesType) {
      priceLinesRef.current.seriesType = nextType;
    }

    if (!activeSeries || !sessionLevels) {
      clearPriceLines();
      return;
    }

    const toPrice = (value?: number | null) =>
      typeof value === "number" && Number.isFinite(value) ? value : null;
    let high = toPrice(sessionLevels.high);
    let low = toPrice(sessionLevels.low);
    const last = toPrice(sessionLevels.last);

    if (high !== null && low !== null && high < low) {
      [high, low] = [low, high];
    }

    const upsertLine = (
      key: "high" | "low" | "last",
      price: number | null,
      options: {
        color: string;
        title: string;
        lineStyle: LineStyle;
        lineWidth: number;
      }
    ) => {
      const existing = priceLinesRef.current[key];
      if (price === null) {
        if (existing) {
          activeSeries.removePriceLine(existing);
          priceLinesRef.current[key] = undefined;
        }
        return;
      }
      if (!existing) {
        priceLinesRef.current[key] = activeSeries.createPriceLine({
          price,
          axisLabelVisible: true,
          title: options.title,
          lineStyle: options.lineStyle,
          lineWidth: options.lineWidth,
          color: options.color,
        });
        return;
      }
      existing.applyOptions({
        price,
        axisLabelVisible: true,
        title: options.title,
        lineStyle: options.lineStyle,
        lineWidth: options.lineWidth,
        color: options.color,
      });
    };

    upsertLine("high", high, {
      color: "#10b981",
      title: "SESSION HIGH",
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
    });
    upsertLine("low", low, {
      color: "#f43f5e",
      title: "SESSION LOW",
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
    });
    upsertLine("last", last, {
      color: "#e2e8f0",
      title: "LAST",
      lineStyle: LineStyle.Solid,
      lineWidth: 2,
    });
  }, [sessionLevels, useLinePrimary, ticker, clearPriceLines]);

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
