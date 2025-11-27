"use client";

import { motion } from "framer-motion";
import { DEMO_CHART_HEIGHTS } from "@/app/(homeAmarketing)/constants";

interface TerminalPreviewCardProps {
  variants?: any;
}

export function TerminalPreviewCard({ variants }: TerminalPreviewCardProps) {
  return (
    <motion.div
      variants={variants}
      className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-2xl"
    >
      {/* Abstract Trading UI */}
      <div className="space-y-4 font-mono text-sm">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
          </div>
          <div className="text-muted-foreground">ESZ25 • CME • LIVE</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">BID</div>
            <div className="text-2xl text-green-500 font-bold">4501.25</div>
            <div className="text-xs text-muted-foreground">Vol: 125</div>
          </div>
          <div className="space-y-2 text-right">
            <div className="text-xs text-muted-foreground">ASK</div>
            <div className="text-2xl text-red-500 font-bold">4501.50</div>
            <div className="text-xs text-muted-foreground">Vol: 84</div>
          </div>
        </div>

        <div className="h-32 flex items-end gap-1 pt-4 border-t border-border/50 opacity-50">
          {DEMO_CHART_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm"
              style={{ height: `${h}%` }}
            ></div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
