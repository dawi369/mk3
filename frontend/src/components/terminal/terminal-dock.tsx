import { Terminal, Activity, Scale, Sparkles } from "lucide-react";

import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";

export type TerminalViewType = "terminal" | "indicators" | "sentiment" | "ai-lab";

interface TerminalDockProps {
  activeView: TerminalViewType;
  onSelect: (view: TerminalViewType) => void;
}

const data: {
  title: string;
  icon: React.ReactNode;
  id: TerminalViewType;
}[] = [
  {
    title: "Terminal",
    id: "terminal",
    icon: <Terminal className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
  },
  {
    title: "Indicators",
    id: "indicators",
    icon: <Activity className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
  },
  {
    title: "Sentiment",
    id: "sentiment",
    icon: <Scale className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
  },
  {
    title: "AI Lab",
    id: "ai-lab",
    icon: <Sparkles className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
  },
];

export function TerminalDock({ activeView, onSelect }: TerminalDockProps) {
  return (
    <div className="absolute bottom-6 left-1/2 max-w-full -translate-x-1/2 z-50">
      <Dock className="items-end pb-3">
        {data.map((item) => (
          <DockItem
            key={item.id}
            className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 cursor-pointer"
            onClick={() => onSelect(item.id)}
          >
            <DockLabel>{item.title}</DockLabel>
            <DockIcon>{item.icon}</DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
}
