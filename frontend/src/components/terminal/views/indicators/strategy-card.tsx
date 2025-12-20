"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tilt } from "@/components/ui/tilt";
import { BorderTrail } from "@/components/ui/border-trail";
import { cn } from "@/lib/utils";
import { CuratedStrategy } from "./mock-indicators-data";
import {
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Target,
  ShieldAlert,
  ArrowRightCircle,
} from "lucide-react";

interface StrategyCardProps {
  strategy: CuratedStrategy;
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  const isBullish = strategy.bias === "BULLISH";
  const isBearish = strategy.bias === "BEARISH";

  return (
    <Tilt
      rotationFactor={1}
      isRevese={true}
      springOptions={{ stiffness: 400, damping: 25 }}
      className="h-full"
    >
      <Card className="relative h-full bg-card border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col p-6">
        <BorderTrail
          className={cn(
            "opacity-50",
            isBullish ? "bg-emerald-500" : isBearish ? "bg-rose-500" : "bg-blue-500"
          )}
          size={120}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: "linear",
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-xl border border-white/10",
                  isBullish
                    ? "bg-emerald-500/10 text-emerald-500"
                    : isBearish
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-blue-500/10 text-blue-500"
                )}
              >
                {isBullish && <TrendingUp className="w-6 h-6" />}
                {isBearish && <TrendingDown className="w-6 h-6" />}
                {!isBullish && !isBearish && <MinusCircle className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  The Play
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tighter">{strategy.bias}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                    Strength: {strategy.strength}/10
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 tracking-tight text-white">{strategy.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{strategy.description}</p>
          </div>

          {/* Execution Grid */}
          <div className="grid grid-cols-3 gap-4 mt-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <ArrowRightCircle className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Entry
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-white">{strategy.entry}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Stop Loss
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-white">{strategy.stop}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Target
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-white">{strategy.target}</span>
            </div>
          </div>
        </div>
      </Card>
    </Tilt>
  );
}
