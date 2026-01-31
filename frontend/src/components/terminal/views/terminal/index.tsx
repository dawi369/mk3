"use client";

import { SectorContainer } from "@/components/terminal/views/terminal/sector-container";
import { useTerminalData } from "@/hooks/use-terminal-data";
import { ErrorBoundary } from "@/components/common/error-boundary";

export function TerminalView() {
  const terminalData = useTerminalData();

  return (
    // Terminal 2.0 View Container
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        gap: "0.6rem",
        width: "100%",
        height: "100%",
        padding: "0.0rem",
        overflow: "hidden",
      }}
    >
      {terminalData.map((data) => (
        <div key={data.id} style={{ minHeight: 0, minWidth: 0, overflow: "hidden", position: "relative" }}>
          <ErrorBoundary name={data.title}>
            <SectorContainer
              title={data.title}
              openInterest={data.openInterest}
              avgChange={data.avgChange}
              isUpdating={false}
              className="h-full w-full"
              // Removed specific showPagination filter to show arrows for all as requested
            />
          </ErrorBoundary>
        </div>
      ))}
    </div>
  );
}
