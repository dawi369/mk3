import { TerminalCard } from "./terminal-card";
import { useTerminalData } from "@/hooks/use-terminal-data";

export function TerminalView() {
  const terminalData = useTerminalData();

  return (
    <div className="h-full w-full p-4 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 h-full w-full">
        {terminalData.map((data) => (
          <div key={data.id} className="min-h-0 min-w-0 h-full">
            <TerminalCard data={data} onClick={() => console.log(`Clicked ${data.title}`)} />
          </div>
        ))}
      </div>
    </div>
  );
}
