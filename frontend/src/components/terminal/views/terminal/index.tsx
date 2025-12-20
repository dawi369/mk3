"use client";

import { useEffect } from "react";
import { TerminalCard } from "@/components/terminal/views/terminal/terminal-card";
import { useTerminalData } from "@/hooks/use-terminal-data";
import { useHeader } from "@/components/terminal/layout/header-provider";

export function TerminalView() {
  const terminalData = useTerminalData();

  return (
    <div className="h-full w-full overflow-hidden flex flex-col gap-4">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 min-h-0">
        {terminalData.map((data) => (
          <div key={data.id} className="min-h-0 min-w-0 h-full">
            <TerminalCard data={data} onClick={() => console.log(`Clicked ${data.title}`)} />
          </div>
        ))}
      </div>
    </div>
  );
}
