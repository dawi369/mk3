"use client";

import { TerminalCard } from "@/components/terminal/views/terminal/terminal-card";
import { useTerminalData } from "@/hooks/use-terminal-data";
import { ErrorBoundary } from "@/components/common/error-boundary";

export function TerminalView() {
  const terminalData = useTerminalData();

  return (
    // STRICT RULES: 3 columns, 2 rows, NO scrolling, equal cards
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        gap: "1rem",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {terminalData.map((data) => (
        <div key={data.id} style={{ minHeight: 0, minWidth: 0, overflow: "hidden" }}>
          <ErrorBoundary name={data.title}>
            <TerminalCard data={data} onClick={() => console.log(`Clicked ${data.title}`)} />
          </ErrorBoundary>
        </div>
      ))}
    </div>
  );
}
