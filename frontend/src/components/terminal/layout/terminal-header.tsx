"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useHeader } from "@/components/terminal/layout/header-provider";
import { AuthIndicator } from "@/components/common/auth-indicator";
import { useTerminalView } from "@/providers/terminal-view-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BarChart2, TrendingUp, Spline, Zap } from "lucide-react";

import { useState } from "react";
// ... (keep other imports)

export function TerminalHeader() {
  const { navContent: manualNavContent } = useHeader();
  const { activeView } = useTerminalView();
  const [viewMode, setViewMode] = useState<"front" | "curve">("front");

  // Declarative navigation mapping
  const renderNavContent = () => {
    // Manual content (e.g. from modals) takes precedence
    if (manualNavContent) return manualNavContent;

    switch (activeView) {
      case "terminal":
        return (
          // Add layout root to the container to coordinate shared layout animations
          // Removed gap-6 to manual handle spacing in the collapsible section for perfect centering
          <motion.div layout className="flex items-center overflow-hidden">
            {/* View Mode Toggle */}
            <motion.div layout="position">
              <ToggleGroup 
                type="single" 
                value={viewMode}
                onValueChange={(val) => val && setViewMode(val as "front" | "curve")}
                className="bg-muted/50 p-1 rounded-lg border border-white/5"
              >
                <ToggleGroupItem value="front" size="sm" className="h-7 px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 mr-2" />
                  Front
                </ToggleGroupItem>
                <ToggleGroupItem value="curve" size="sm" className="h-7 px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
                  <Spline className="w-3.5 h-3.5 mr-2" />
                  Curve
                </ToggleGroupItem>
              </ToggleGroup>
            </motion.div>

            {/* Collapsible Section: Separator + Month Nav (Commented out for now) */}
            {/* <motion.div
              layout
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: viewMode === "curve" ? "auto" : 0,
                opacity: viewMode === "curve" ? 1 : 0,
              }}
              transition={{ 
                duration: 0.3, 
                ease: "circOut" 
              }}
              style={{ 
                pointerEvents: viewMode === "curve" ? "auto" : "none" 
              }}
              className="flex items-center overflow-hidden whitespace-nowrap"
            >
               <div className="flex items-center pl-6 gap-6">
                  <div className="w-px h-4 bg-border/50 origin-center" />

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-mono font-bold bg-muted/30 px-3 py-1.5 rounded-md border border-white/5 min-w-[80px] text-center">
                      DEC 25
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
               </div>
            </motion.div> */}
          </motion.div>
        );
      case "sentiment":
      case "ai-lab":
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md">
      <div className="flex h-14 items-center px-4">
        {/* Logo - left aligned */}
        <div className="w-48 shrink-0">
          <Link href="/" className="flex items-center">
            <motion.div
              layoutId="header-logo"
              layout="position"
              className="flex items-center will-change-transform"
            >
              <Image
                src="/mk3LogoTransparent.png"
                alt="Swordfish Logo"
                width={40}
                height={40}
                priority
                className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity"
              />
            </motion.div>
          </Link>
        </div>

        {/* View-specific nav content - center */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView + (manualNavContent ? "-manual" : "")}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
            >
              {renderNavContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Auth indicator - right aligned */}
        <div className="w-48 shrink-0 flex justify-end">
          <motion.div layoutId="header-auth" layout="position" className="will-change-transform">
            <AuthIndicator align="right" />
          </motion.div>
        </div>
      </div>
    </header>
  );
}
function activeViewKey(content: React.ReactNode): string {
  if (!content) return "empty";
  // Try to use a display name or type name as a key if available
  return "nav-content";
}
