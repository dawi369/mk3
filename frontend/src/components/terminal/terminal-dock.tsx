import { useState, useEffect } from "react";
import { Terminal, Activity, Scale, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [forceVisible, setForceVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Start extended, then retract after a delay
    const timer = setTimeout(() => {
      setForceVisible(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const centerX = windowWidth / 2;

      // Dock-shaped trigger area dimensions (matching the visual indicator)
      const dockWidth = 320;
      const dockHeight = 150;

      // Calculate the bounds of the trigger area
      // The visual dock is at bottom: 0, translate-y-[50%], so it's centered on the bottom edge
      const dockLeft = centerX - dockWidth / 2;
      const dockRight = centerX + dockWidth / 2;
      const dockTop = windowHeight - dockHeight / 2;
      const dockBottom = windowHeight + dockHeight / 2;

      // Check if mouse is within the rectangular dock-shaped bounds
      const isInBounds =
        e.clientX >= dockLeft &&
        e.clientX <= dockRight &&
        e.clientY >= dockTop &&
        e.clientY <= dockBottom;

      setIsHovered(isInBounds);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isVisible = forceVisible || isHovered;

  return (
    <>
      {/* Trigger Area - visible dock-shaped outline */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[320px] h-[150px] translate-y-[50%] bg-transparent rounded-full pointer-events-none z-90" />

      <motion.div
        className="fixed bottom-2 left-1/2 max-w-full -translate-x-1/2 z-999"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : "85%" }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
      >
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
      </motion.div>
    </>
  );
}
