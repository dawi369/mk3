import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTickerStore } from "@/store/use-ticker-store";
import { useConnection } from "@/providers/connection-provider";

export function StreamView() {
  const mode = useTickerStore((state) => state.mode);
  const marketData = useTickerStore((state) => state.seriesByMode[mode]);
  const { status } = useConnection();

  // Flatten all bars for display
  const allBars = Object.entries(marketData).flatMap(([symbol, bars]) =>
    bars.map((bar) => ({ ...bar, symbol }))
  );

  // Sort by time descending for the log view
  const sortedBars = [...allBars].sort((a, b) => b.startTime - a.startTime).slice(0, 100);

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Stream (Dev)</h1>
          <p className="text-muted-foreground text-sm">
            Real-time feed from Redis Stream via WebSocket Proxy
          </p>
        </div>
        <Badge variant={status === "connected" ? "default" : "destructive"}>
          {status.toUpperCase()}
        </Badge>
      </header>

      <Card className="flex-1 overflow-hidden bg-black/50 border-zinc-800">
        <ScrollArea className="h-full p-4">
          <div className="space-y-2 font-mono text-xs">
            {sortedBars.map((bar, i) => (
              <div
                key={`${bar.symbol}-${bar.startTime}-${i}`}
                className="flex gap-4 p-2 hover:bg-white/5 rounded transition-colors border-b border-white/5 last:border-0"
              >
                <span className="text-zinc-500 w-24 shrink-0">
                  {new Date(bar.startTime).toLocaleTimeString()}
                </span>
                <span className="text-blue-400 w-20 shrink-0">{bar.symbol}</span>
                <span className="text-zinc-300 break-all">
                  O:{bar.open} H:{bar.high} L:{bar.low} C:{bar.close} V:{bar.volume}
                </span>
              </div>
            ))}
            {sortedBars.length === 0 && (
              <div className="text-center text-zinc-500 py-12">Waiting for data...</div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
