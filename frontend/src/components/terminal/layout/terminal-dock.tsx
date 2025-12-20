"use client";

import { Terminal, Activity, Scale, Sparkles, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";

export type TerminalViewType = "terminal" | "indicators" | "sentiment" | "ai-lab";

interface TerminalDockProps {
  activeView: TerminalViewType;
  onSelect: (view: TerminalViewType) => void;
}

const data: {
  title: string;
  icon: LucideIcon;
  id: TerminalViewType;
}[] = [
  {
    title: "Terminal",
    id: "terminal",
    icon: Terminal,
  },
  {
    title: "Indicators",
    id: "indicators",
    icon: Activity,
  },
  {
    title: "Sentiment",
    id: "sentiment",
    icon: Scale,
  },
  {
    title: "AI Lab",
    id: "ai-lab",
    icon: Sparkles,
  },
];

export function TerminalDock({ activeView, onSelect }: TerminalDockProps) {
  return (
    <motion.div
      className="fixed bottom-2 left-1/2 max-w-full -translate-x-1/2 z-999"
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 40,
      }}
    >
      <Dock className="items-end pb-3 bg-neutral-950/90 border-white/10 shadow-2xl backdrop-blur-none">
        {data.map((item) => (
          <DockItem
            key={item.id}
            className="aspect-square rounded-full cursor-pointer relative"
            onClick={() => onSelect(item.id)}
          >
            <DockLabel className="bg-neutral-900 border-white/10 text-neutral-200">
              {item.title}
            </DockLabel>
            <DockIcon>
              {activeView === item.id && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-full bg-neutral-800 border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon
                className={cn(
                  "h-full w-full transition-colors duration-200 relative z-10 p-0.5",
                  activeView === item.id
                    ? "text-white scale-110"
                    : "text-neutral-500 hover:text-neutral-300"
                )}
              />
            </DockIcon>
          </DockItem>
        ))}
      </Dock>
    </motion.div>
  );
}
