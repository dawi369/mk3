"use client";

export function SentimentView() {
  return (
    <div className="h-full w-full overflow-auto space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-foreground mb-2">Sentiment</h1>
          <p className="text-muted-foreground">Temp.</p>
        </header>
      </div>
    </div>
  );
}
