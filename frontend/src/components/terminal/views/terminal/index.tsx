"use client";

import { useEffect } from "react";
import { TerminalCard } from "@/components/terminal/views/terminal/terminal-card";
import { useTerminalData } from "@/hooks/use-terminal-data";
import { ErrorBoundary } from "@/components/common/error-boundary";

export function TerminalView() {
  const terminalData = useTerminalData();

  return (
    <div className="h-full w-full overflow-hidden flex flex-col gap-4">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 lg:grid-rows-2 gap-4 min-h-0">
        {terminalData.map((data) => (
          <div key={data.id} className="min-h-0 min-w-0 h-full">
            <ErrorBoundary name={data.title}>
              <TerminalCard data={data} onClick={() => console.log(`Clicked ${data.title}`)} />
            </ErrorBoundary>
          </div>
        ))}
      </div>
    </div>
  );
}
