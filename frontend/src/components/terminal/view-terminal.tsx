"use client";

import { TerminalCard } from "./terminal-card";
import { mockTerminalData } from "./mock-data";

export function TerminalView() {
  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1920px] mx-auto h-full content-start">
        {mockTerminalData.map((data) => (
          <div key={data.id} className="aspect-video min-h-[300px]">
            <TerminalCard data={data} onClick={() => console.log(`Clicked ${data.title}`)} />
          </div>
        ))}
      </div>
    </div>
  );
}
