"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextPanelProps {
  contract: string | null;
  timeframe: string;
}

export function ContextPanel({ contract, timeframe }: ContextPanelProps) {
  return (
    <Card className="h-full flex flex-col border-white/10 bg-card/50">
      <CardHeader className="py-3 px-4 border-b border-white/10">
        <CardTitle className="text-sm font-medium">
          {contract ? `${contract} · Deep Dive` : "Select a contract"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {contract ? (
          <Tabs defaultValue="chart" className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-transparent h-9 px-2">
              <TabsTrigger value="chart" className="gap-1.5 text-xs data-[state=active]:bg-muted">
                <BarChart3 className="w-3.5 h-3.5" />
                Chart
              </TabsTrigger>
              <TabsTrigger
                value="correlation"
                className="gap-1.5 text-xs data-[state=active]:bg-muted"
              >
                <GitBranch className="w-3.5 h-3.5" />
                Correlation
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="flex-1 m-0 p-4 space-y-6">
              {/* Technical Status Gauges */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Bull/Bear Power
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      65% Bullish
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                    <div
                      className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      style={{ width: "65%" }}
                    />
                    <div className="h-full bg-rose-500/20" style={{ width: "35%" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      RSI (14)
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground">62.4</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                    {/* Overbought/Oversold markers */}
                    <div className="absolute left-[30%] top-0 bottom-0 w-px bg-white/10" />
                    <div className="absolute left-[70%] top-0 bottom-0 w-px bg-white/10" />
                    <div className="h-full bg-white/20" style={{ width: "62.4%" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Trend Maturity
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-500">Late Stage</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                      style={{ width: "82%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Signal History / Alerts */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5 pb-1">
                  Recent Signals
                </h3>
                <div className="space-y-2">
                  {[
                    { time: "14:20", signal: "RSI Divergence", color: "text-emerald-500" },
                    { time: "12:05", signal: "MACD Cross Over", color: "text-emerald-500" },
                    { time: "09:15", signal: "VWAP Rejection", color: "text-rose-500" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs font-mono border-b border-white/2 pb-1.5"
                    >
                      <span className="text-muted-foreground/50">{s.time}</span>
                      <span className={cn("font-bold", s.color)}>{s.signal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary View Placeholder */}
              <div className="flex-1 bg-white/2 rounded-lg border border-dashed border-white/10 flex items-center justify-center p-4">
                <div className="text-center text-muted-foreground/40">
                  <p className="text-[10px] font-bold uppercase">Advanced Charting View</p>
                  <p className="text-[9px] mt-1 italic tracking-tight">
                    LWC v4 Engine Integration Sandbox
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="correlation" className="flex-1 m-0 p-3">
              <div className="h-full rounded-lg border border-white/10 bg-black/20 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium mb-1">Cross-Market Correlation</p>
                  <p className="text-xs">Network visualization</p>
                  <p className="text-xs mt-4 text-muted-foreground/60">(Coming soon)</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Click a row in the table</p>
              <p className="text-xs mt-1">to view indicator details</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
