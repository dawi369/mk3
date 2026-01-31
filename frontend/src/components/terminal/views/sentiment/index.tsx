import {
  MacroGauge,
  AssetSentimentRow,
  ThemeCard,
  MetricCard,
  StatusGauge,
} from "./sentiment-components";
import { mockSentimentData } from "./mock-sentiment-data";
import { TrendingUp, Flame, Target, Zap, Gauge } from "lucide-react";

export function SentimentView() {
  const { indicators } = mockSentimentData;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        width: "100%",
        height: "100%",
        padding: "0.0rem",
        overflow: "hidden",
      }}
    >
      {/* Top Row: Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <MetricCard
          title="Global Momentum"
          value={indicators.globalMomentum}
          change="↑ STRONG BULLISH"
          changeType="positive"
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Volatility Index"
          value={indicators.volatilityIndex}
          change="! ELEVATED"
          changeType="negative"
          icon={<Flame className="w-4 h-4 text-rose-500" />}
        />
        <MetricCard
          title="Avg Trend Str"
          value={indicators.avgTrendStr}
          change="HIGH ALIGNMENT"
          changeType="positive"
          icon={<Target className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Volume Flow"
          value={indicators.volumeFlow}
          change="NET BUYING"
          changeType="positive"
          icon={<Zap className="w-4 h-4 text-amber-500" />}
        />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Macro & Assets (5 columns) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 h-full overflow-hidden">
          <MacroGauge value={mockSentimentData.macro} />

          {/* Market Status Indicators (Ported from Indicators) */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-3">
            <StatusGauge
              label="Trend Strength"
              value={`${indicators.trendStrength}%`}
              percent={indicators.trendStrength}
              icon={<Gauge className="w-3.5 h-3.5" />}
              subLabel={indicators.trendStrength > 70 ? "Dominant Trend" : "Established"}
              statusColor="text-emerald-500"
            />
            <StatusGauge
              label="Volatility Regime"
              value={indicators.volatilityRegime}
              percent={indicators.volatilityValue * 2}
              icon={<Flame className="w-3.5 h-3.5" />}
              subLabel={`Current ATR: ${indicators.volatilityValue}%`}
              statusColor={
                indicators.volatilityRegime === "EXPANDING" ? "text-rose-500" : "text-blue-400"
              }
            />
            <StatusGauge
              label="Momentum"
              value={indicators.momentum > 0 ? `+${indicators.momentum}` : indicators.momentum}
              percent={Math.abs(indicators.momentum)}
              icon={<Zap className="w-3.5 h-3.5" />}
              subLabel={indicators.momentum > 50 ? "Overbought Profile" : "Stable Flow"}
              statusColor={indicators.momentum > 0 ? "text-emerald-400" : "text-rose-400"}
            />
          </div>

          {/* <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 sticky top-0 bg-background/50 backdrop-blur pb-2 z-10">
              Asset Sentiment
            </h3>
            {mockSentimentData.assets.map((asset) => (
              <AssetSentimentRow key={asset.symbol} item={asset} />
            ))}
          </div> */}
        </div>

        {/* Right Column: Themes & Narratives (7 columns) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Market Narratives
            </h3>
            <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-1 content-start">
            {mockSentimentData.themes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
