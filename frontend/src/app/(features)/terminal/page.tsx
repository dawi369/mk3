"use client";

import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalView } from "@/components/terminal/views/terminal";
import { AiLabView } from "@/components/terminal/views/ai-lab";
import { BacktestingView } from "@/components/terminal/views/backtesting";
import { useTerminalView } from "@/providers/terminal-view-provider";
import { ErrorBoundary } from "@/components/common/error-boundary";

function TerminalPageContent() {
  const { activeView } = useTerminalView();

  return (
    <div className="h-full w-full overflow-hidden bg-background">
      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1], // Custom ease-out expo
          }}
          className="h-full w-full"
        >
          {activeView === "terminal" && (
            <ErrorBoundary name="Main Terminal">
              <TerminalView />
            </ErrorBoundary>
          )}
          {activeView === "ai-lab" && (
            <ErrorBoundary name="AI Lab">
              <AiLabView />
            </ErrorBoundary>
          )}
          {activeView === "backtesting" && (
            <ErrorBoundary name="Backtesting">
              <BacktestingView />
            </ErrorBoundary>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <TerminalPageContent />
    </Suspense>
  );
}
