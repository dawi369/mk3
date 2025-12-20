"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Zap, Gauge, Flame } from "lucide-react";

interface GaugeProps {
  label: string;
  value: number | string;
  percent?: number;
  icon: React.ReactNode;
  subLabel?: string;
  statusColor?: string;
}

function StatusGauge({ label, value, percent, icon, subLabel, statusColor }: GaugeProps) {
  return (
    <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-3 relative overflow-hidden group">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-neutral-900 border border-white/5 text-muted-foreground group-hover:text-white transition-colors">
            {icon}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
        </div>
        <span className={cn("text-lg font-mono font-black", statusColor || "text-white")}>
          {value}
        </span>
      </div>

      {percent !== undefined && (
        <div className="space-y-1.5 relative z-10">
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              className={cn(
                "h-full rounded-full shadow-[0_0_8px]",
                statusColor?.replace("text-", "bg-") || "bg-white"
              )}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          {subLabel && (
            <p className="text-[10px] font-medium text-muted-foreground/60">{subLabel}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface MarketStatusGaugesProps {
  trendStrength: number;
  volatilityRegime: string;
  volatilityValue: number;
  momentum: number;
}

export function MarketStatusGauges({
  trendStrength,
  volatilityRegime,
  volatilityValue,
  momentum,
}: MarketStatusGaugesProps) {
  return (
    <div className="grid grid-cols-1 gap-3 h-full">
      <StatusGauge
        label="Trend Strength"
        value={`${trendStrength}%`}
        percent={trendStrength}
        icon={<Gauge className="w-3.5 h-3.5" />}
        subLabel={
          trendStrength > 70 ? "Dominant Trend" : trendStrength > 40 ? "Established" : "Weak/Noisy"
        }
        statusColor={
          trendStrength > 70
            ? "text-emerald-500"
            : trendStrength > 40
            ? "text-blue-400"
            : "text-amber-500"
        }
      />

      <StatusGauge
        label="Volatility Regime"
        value={volatilityRegime}
        percent={volatilityValue * 2} // Adaptive scaling
        icon={<Flame className="w-3.5 h-3.5" />}
        subLabel={`Current ATR: ${volatilityValue}%`}
        statusColor={volatilityRegime === "EXPANDING" ? "text-rose-500" : "text-blue-400"}
      />

      <StatusGauge
        label="Momentum"
        value={momentum > 0 ? `+${momentum}` : momentum}
        percent={Math.abs(momentum)}
        icon={<Zap className="w-3.5 h-3.5" />}
        subLabel={
          momentum > 50 ? "Overbought Profile" : momentum < -50 ? "Oversold Profile" : "Stable Flow"
        }
        statusColor={momentum > 0 ? "text-emerald-400" : "text-rose-400"}
      />
    </div>
  );
}
