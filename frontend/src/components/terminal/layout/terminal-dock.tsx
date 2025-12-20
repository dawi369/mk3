import { useState, useEffect } from "react";
import { Terminal, Activity, Scale, Sparkles, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [forceVisible, setForceVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Start extended, then retract after a delay
    const timer = setTimeout(() => {
      setForceVisible(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const centerX = windowWidth / 2;

      // Dock-shaped trigger area dimensions (matching the visual indicator)
      const dockWidth = 320;
      const dockHeight = 140;

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
        animate={{ y: isVisible ? 0 : "120%" }}
        // transition={{ type: "spring", damping: 25, stiffness: 250 }}
        // transition={{
        //   type: "spring",
        //   stiffness: 350,
        //   damping: 30,
        //   mass: 0.8,
        // }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 40,
        }}
      >
        <Dock className="items-end pb-3 bg-neutral-950 border-white/5 shadow-2xl backdrop-blur-none">
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
                    "h-full w-full transition-colors duration-200 relative z-10",
                    activeView === item.id ? "text-white scale-110" : "text-neutral-500"
                  )}
                />
              </DockIcon>
            </DockItem>
          ))}
        </Dock>
      </motion.div>
    </>
  );
}
