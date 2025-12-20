import { MacroGauge, AssetSentimentRow, ThemeCard } from "./sentiment-components";
import { mockSentimentData } from "./mock-sentiment-data";

export function SentimentView() {
  return (
    <div className="h-full w-full overflow-hidden flex flex-col gap-6">
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Macro & Assets (5 columns) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 h-full overflow-hidden">
          <MacroGauge value={mockSentimentData.macro} />

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 sticky top-0 bg-background/50 backdrop-blur pb-2 z-10">
              Asset Sentiment
            </h3>
            {mockSentimentData.assets.map((asset) => (
              <AssetSentimentRow key={asset.symbol} item={asset} />
            ))}
          </div>
        </div>

        {/* Right Column: Themes & Narratives (7 columns) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Market Narratives
            </h3>
            <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-1 content-start">
            {mockSentimentData.themes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
