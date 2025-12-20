"use client";

import React from "react";
import { TechnicalLevels } from "./mock-indicators-data";
import { cn } from "@/lib/utils";

interface IndicatorLevelsProps {
  levels: TechnicalLevels;
}

export function IndicatorLevels({ levels }: IndicatorLevelsProps) {
  const levelClass =
    "flex items-center justify-between py-2 px-3 rounded-lg border border-white/[0.03] transition-colors hover:bg-white/[0.02]";

  return (
    <div className="flex flex-col gap-1.5 h-full">
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Technical Levels
        </span>
        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest font-mono">
          Daily
        </span>
      </div>

      <div className={cn(levelClass, "bg-rose-500/3 border-rose-500/10")}>
        <span className="text-[10px] font-bold text-rose-500/80 tracking-widest">R3</span>
        <span className="text-sm font-mono font-bold text-rose-400">{levels.r3}</span>
      </div>
      <div className={cn(levelClass, "bg-rose-500/1")}>
        <span className="text-[10px] font-bold text-rose-400/60 tracking-widest">R2</span>
        <span className="text-sm font-mono font-bold text-rose-400/80">{levels.r2}</span>
      </div>
      <div className={levelClass}>
        <span className="text-[10px] font-bold text-rose-400/40 tracking-widest">R1</span>
        <span className="text-sm font-mono font-bold text-rose-400/60">{levels.r1}</span>
      </div>

      <div className={cn(levelClass, "bg-white/5 border-white/10 my-1 py-3 group")}>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-blue-400 tracking-[0.2em] uppercase leading-none mb-1">
            Pivot
          </span>
          <span className="text-xs font-bold text-blue-300/60 uppercase tracking-tight">
            Center Point
          </span>
        </div>
        <span className="text-lg font-mono font-black text-white group-hover:scale-105 transition-transform">
          {levels.pivot}
        </span>
      </div>

      <div className={levelClass}>
        <span className="text-[10px] font-bold text-emerald-400/40 tracking-widest">S1</span>
        <span className="text-sm font-mono font-bold text-emerald-400/60">{levels.s1}</span>
      </div>
      <div className={cn(levelClass, "bg-emerald-500/1")}>
        <span className="text-[10px] font-bold text-emerald-400/60 tracking-widest">S2</span>
        <span className="text-sm font-mono font-bold text-emerald-400/80">{levels.s2}</span>
      </div>
      <div className={cn(levelClass, "bg-emerald-500/3 border-emerald-500/10")}>
        <span className="text-[10px] font-bold text-emerald-500/80 tracking-widest">S3</span>
        <span className="text-sm font-mono font-bold text-emerald-400">{levels.s3}</span>
      </div>
    </div>
  );
}
