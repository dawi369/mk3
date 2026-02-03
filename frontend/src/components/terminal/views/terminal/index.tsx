"use client";

import { SectorContainer } from "@/components/terminal/views/terminal/sector-container";
import { useTerminalData } from "@/hooks/use-terminal-data";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { TickerEntry } from "@/components/terminal/views/terminal/ticker-entry";
import { useHeader } from "@/components/terminal/layout/header-provider";

export function TerminalView() {
  const terminalData = useTerminalData();
  const { visibleRows } = useHeader();

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
              visibleRows={visibleRows}
              // Removed specific showPagination filter to show arrows for all as requested
            >
              {data.symbols.map((symbol) => (
                <TickerEntry key={symbol} symbol={symbol} />
              ))}
            </SectorContainer>
          </ErrorBoundary>
        </div>
      ))}
    </div>
  );
}
