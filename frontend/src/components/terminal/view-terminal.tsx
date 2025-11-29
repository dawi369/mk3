"use client";

export function TerminalView() {
  return (
    <div className="p-8 pt-24 h-full overflow-auto pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-foreground mb-2">Terminal</h1>
          <p className="text-muted-foreground">Temp.</p>
        </header>
      </div>
    </div>
  );
}
