"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Types from sentiment.txt
export type PercentLikeMetricKey =
  | "vix_percentile"
  | "rv_breadth_5_over_20"
  | "tail_pressure_score"
  | "pct_above_sma50"
  | "pct_above_sma200"
  | "pct_adx_gt_20"
  | "spy_over_tlt_pctile"
  | "hyg_over_lqd_pctile"
  | "usd_pctile"
  | "commods_1d_mom_breadth"
  | "carry_breadth_supported";

export type CurveStateMetricKey = "crude_curve_state" | "natgas_curve_state";

export type RegimeMetricKey = PercentLikeMetricKey | CurveStateMetricKey;

export interface RegimeMetricDescriptor {
  key: RegimeMetricKey;
  label: string;
  kind: "percent" | "state";
}

export interface RegimePanelConfig {
  id: string;
  title: string;
  metrics: RegimeMetricDescriptor[];
  enabled?: boolean;
}

export const regime_panels: RegimePanelConfig[] = [
  {
    id: "volatility",
    title: "Volatility Regime",
    metrics: [
      { key: "vix_percentile", label: "VIX pctile", kind: "percent" },
      {
        key: "rv_breadth_5_over_20",
        label: "RV breadth↑",
        kind: "percent",
      },
      { key: "tail_pressure_score", label: "Tail pressure", kind: "percent" },
    ],
    enabled: true,
  },
  {
    id: "trend",
    title: "Trend Regime",
    metrics: [
      { key: "pct_above_sma50", label: ">50D", kind: "percent" },
      { key: "pct_above_sma200", label: ">200D", kind: "percent" },
      { key: "pct_adx_gt_20", label: "ADX>20", kind: "percent" },
    ],
    enabled: true,
  },
  {
    id: "risk_appetite",
    title: "Risk Appetite",
    metrics: [
      { key: "spy_over_tlt_pctile", label: "SPY/TLT", kind: "percent" },
      { key: "hyg_over_lqd_pctile", label: "HYG/LQD", kind: "percent" },
      { key: "usd_pctile", label: "USD", kind: "percent" },
      {
        key: "commods_1d_mom_breadth",
        label: "Cmdty 1D↑ breadth",
        kind: "percent",
      },
    ],
    enabled: true,
  },
  {
    id: "carry",
    title: "Carry Regime",
    metrics: [
      { key: "crude_curve_state", label: "Crude", kind: "state" },
      { key: "natgas_curve_state", label: "NatGas", kind: "state" },
      {
        key: "carry_breadth_supported",
        label: "Carry breadth",
        kind: "percent",
      },
    ],
    enabled: true,
  },
];

// Mock data for display
const mockRegimeData: Record<RegimeMetricKey, number | string> = {
  vix_percentile: 45,
  rv_breadth_5_over_20: 60,
  tail_pressure_score: 12,
  pct_above_sma50: 75,
  pct_above_sma200: 82,
  pct_adx_gt_20: 30,
  spy_over_tlt_pctile: 65,
  hyg_over_lqd_pctile: 55,
  usd_pctile: 80,
  commods_1d_mom_breadth: 40,
  carry_breadth_supported: 70,
  crude_curve_state: "backwardation",
  natgas_curve_state: "contango",
};

export function SentimentPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {regime_panels.map((panel) => (
        <div key={panel.id} className="glass-panel rounded-xl p-4">
          <h4 className="text-sm font-bold font-space text-muted-foreground uppercase mb-4 tracking-wider">
            {panel.title}
          </h4>
          <div className="space-y-3">
            {panel.metrics.map((metric) => (
              <div
                key={metric.key}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-mono text-muted-foreground">
                  {metric.label}
                </span>
                {metric.kind === "percent" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${mockRegimeData[metric.key]}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          (mockRegimeData[metric.key] as number) > 70
                            ? "bg-green-500"
                            : (mockRegimeData[metric.key] as number) < 30
                            ? "bg-red-500"
                            : "bg-yellow-500"
                        )}
                      />
                    </div>
                    <span className="text-xs font-mono w-8 text-right">
                      {mockRegimeData[metric.key]}%
                    </span>
                  </div>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-mono px-2 py-0.5 rounded-full border",
                      mockRegimeData[metric.key] === "backwardation"
                        ? "border-green-500/30 text-green-500 bg-green-500/10"
                        : "border-red-500/30 text-red-500 bg-red-500/10"
                    )}
                  >
                    {mockRegimeData[metric.key]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
