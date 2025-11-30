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
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const centerX = windowWidth / 2;

      // Calculate distance from the bottom center of the screen
      const dx = e.clientX - centerX;
      const dy = e.clientY - windowHeight;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Threshold for the "invisible half ellipse"
      // Using a simple distance check creates a circular trigger area
      // centered at (centerX, windowHeight)
      if (distance < 300) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isVisible = forceVisible || isHovered;

  return (
    <>
      {/* Debug Trigger Area - Semi-transparent white half ellipse */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] translate-y-1/2 bg-white/5 rounded-full pointer-events-none blur-xl z-40" />

      <motion.div
        className="absolute bottom-6 left-1/2 max-w-full -translate-x-1/2 z-50"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : "85%" }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
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
