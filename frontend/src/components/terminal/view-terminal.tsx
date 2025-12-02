import { TerminalCard } from "./terminal-card";
import { useTerminalData } from "@/hooks/use-terminal-data";

export function TerminalView() {
  const terminalData = useTerminalData();

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-x-4 top-4 bottom-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4">
        {terminalData.map((data) => (
          <div key={data.id} className="min-h-0 min-w-0 h-full">
            <TerminalCard data={data} onClick={() => console.log(`Clicked ${data.title}`)} />
          </div>
        ))}
      </div>
    </div>
  );
}
