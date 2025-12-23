"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Activity,
  Zap,
  Gauge,
  Flame,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SentimentAssetData, SentimentTheme } from "./mock-sentiment-data";

export const MacroGauge = ({ value }: { value: number }) => {
  const isPositive = value >= 50;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/3 border border-white/5 rounded-4xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-radial-at-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 text-center">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">
          Market Mood Index
        </h3>
        <div className="text-7xl font-black tracking-tighter mb-2 font-mono">{value}</div>
        <div
          className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5",
            isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
          )}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "Optimistic" : "Pessimistic"}
        </div>
      </div>

      {/* Visual meter */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full rounded-r-full", isPositive ? "bg-emerald-500" : "bg-rose-500")}
          transition={{ duration: 1.5, ease: "circOut" }}
        />
      </div>
    </div>
  );
};

export const AssetSentimentRow = ({ item }: { item: SentimentAssetData }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
      <div className="flex flex-col">
        <span className="text-sm font-bold tracking-tight">{item.symbol}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {item.name}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-base font-mono font-black",
                item.sentiment > 60
                  ? "text-emerald-500"
                  : item.sentiment < 40
                  ? "text-rose-500"
                  : "text-white"
              )}
            >
              {item.sentiment}
            </span>
            <div className="text-muted-foreground/30">
              {item.trend === "improving" ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : item.trend === "deteriorating" ? (
                <TrendingDown className="w-3 h-3 text-rose-500" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
            </div>
          </div>
          <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
            <div
              className={cn("h-full", item.sentiment > 50 ? "bg-emerald-500" : "bg-rose-500")}
              style={{ width: `${item.sentiment}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ThemeCard = ({ theme }: { theme: SentimentTheme }) => {
  const isImpactPositive = theme.impact > 0;

  return (
    <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-3xl relative overflow-hidden group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              {theme.category}
            </span>
            <span
              className={cn(
                "text-[8px] font-black uppercase tracking-widest",
                theme.status === "growing" ? "text-emerald-500" : "text-muted-foreground"
              )}
            >
              {theme.status}
            </span>
          </div>
          <h4 className="text-sm font-bold leading-tight">{theme.title}</h4>
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xs",
            isImpactPositive
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
          )}
        >
          {isImpactPositive ? "+" : ""}
          {theme.impact}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Impact Score</span>
        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn("h-full", isImpactPositive ? "bg-emerald-500" : "bg-rose-500")}
            style={{ width: `${Math.abs(theme.impact)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// --- Ported Indicator Components ---

interface GaugeProps {
  label: string;
  value: number | string;
  percent?: number;
  icon: React.ReactNode;
  subLabel?: string;
  statusColor?: string;
}

export function StatusGauge({ label, value, percent, icon, subLabel, statusColor }: GaugeProps) {
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

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

export function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden border-2 border-white/20 bg-card shadow-lg h-full">
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full",
          changeType === "positive" && "bg-emerald-500/50",
          changeType === "negative" && "bg-rose-500/50",
          changeType === "neutral" && "bg-muted-foreground/30"
        )}
      />
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
              {title}
            </p>
            <p className="text-xl font-bold tracking-tight font-mono">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-[10px] font-bold tracking-tight uppercase px-1.5 py-0.5 rounded w-fit",
                  changeType === "positive" && "bg-emerald-500/10 text-emerald-500",
                  changeType === "negative" && "bg-rose-500/10 text-rose-500",
                  changeType === "neutral" && "bg-muted/30 text-muted-foreground"
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-white/2 border border-white/5 opacity-80">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
