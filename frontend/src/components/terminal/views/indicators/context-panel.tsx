"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, GitBranch } from "lucide-react";

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
            <TabsContent value="chart" className="flex-1 m-0 p-3">
              <div className="h-full rounded-lg border border-white/10 bg-black/20 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium mb-1">
                    {contract} · {timeframe}
                  </p>
                  <p className="text-xs">Chart with RSI, MACD, Volume</p>
                  <p className="text-xs mt-4 text-muted-foreground/60">
                    (LWC integration coming soon)
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
