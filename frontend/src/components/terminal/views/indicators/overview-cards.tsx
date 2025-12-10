"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Flame, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="relative overflow-hidden border-white/10 bg-card/50">
      <div className={cn("absolute inset-0 opacity-10", gradient)} />
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-xs font-medium",
                  changeType === "positive" && "text-emerald-500",
                  changeType === "negative" && "text-rose-500",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-white/5">{icon}</div>
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
        change="↑ 2.3 from prev session"
        changeType="positive"
        icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
        gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
      />
      <MetricCard
        title="Volatility Index"
        value="18.4%"
        change="Elevated"
        changeType="negative"
        icon={<Flame className="w-5 h-5 text-orange-500" />}
        gradient="bg-gradient-to-br from-orange-500 to-red-600"
      />
      <MetricCard
        title="Trend Strength"
        value="8.5/10"
        change="Strong bullish alignment"
        changeType="positive"
        icon={<Target className="w-5 h-5 text-blue-500" />}
        gradient="bg-gradient-to-br from-blue-500 to-blue-700"
      />
      <MetricCard
        title="Volume Flow"
        value="+1.2k"
        change="Net buying pressure"
        changeType="positive"
        icon={<Zap className="w-5 h-5 text-yellow-500" />}
        gradient="bg-gradient-to-br from-yellow-500 to-amber-600"
      />
    </div>
  );
}
