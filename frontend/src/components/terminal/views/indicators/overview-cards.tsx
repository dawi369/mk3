"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Flame, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tilt } from "@/components/ui/tilt";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  gradient: string;
}

function MetricCard({ title, value, change, changeType, icon, gradient }: MetricCardProps) {
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

export function OverviewCards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Global Momentum"
        value="+74.5"
        change="↑ STRONG BULLISH"
        changeType="positive"
        icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        gradient=""
      />
      <MetricCard
        title="Volatility Index"
        value="18.4%"
        change="! ELEVATED"
        changeType="negative"
        icon={<Flame className="w-4 h-4 text-rose-500" />}
        gradient=""
      />
      <MetricCard
        title="Avg Trend Str"
        value="8.5/10"
        change="HIGH ALIGNMENT"
        changeType="positive"
        icon={<Target className="w-4 h-4 text-emerald-500" />}
        gradient=""
      />
      <MetricCard
        title="Volume Flow"
        value="+1.2M"
        change="NET BUYING"
        changeType="positive"
        icon={<Zap className="w-4 h-4 text-amber-500" />}
        gradient=""
      />
    </div>
  );
}
