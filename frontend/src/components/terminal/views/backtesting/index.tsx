import { FlaskConical } from "lucide-react";

export function BacktestingView() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <FlaskConical className="w-12 h-12 opacity-20" />
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground/80 mb-1">Backtesting Engine</h1>
        <p className="text-sm opacity-60">Historical simulation suite under construction.</p>
      </div>
    </div>
  );
}
