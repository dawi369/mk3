"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useHeader } from "@/components/terminal/layout/header-provider";
import { AuthIndicator } from "@/components/common/auth-indicator";
import { useTerminalView } from "@/providers/terminal-view-provider";

export function TerminalHeader() {
  const { navContent: manualNavContent } = useHeader();
  const { activeView, timeframe, setTimeframe, asset, setAsset } = useTerminalView();

  // Declarative navigation mapping
  const renderNavContent = () => {
    // Manual content (e.g. from modals) takes precedence
    if (manualNavContent) return manualNavContent;

    switch (activeView) {
      case "terminal":
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
