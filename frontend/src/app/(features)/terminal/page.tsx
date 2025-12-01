"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { TerminalDock, TerminalViewType } from "@/components/terminal/terminal-dock";
import { TerminalView } from "@/components/terminal/view-terminal";
import { IndicatorsView } from "@/components/terminal/view-indicators";
import { SentimentView } from "@/components/terminal/view-sentiment";
import { AiLabView } from "@/components/terminal/view-ai-lab";

const VALID_VIEWS: TerminalViewType[] = ["terminal", "indicators", "sentiment", "ai-lab"];

function isValidView(view: string | null): view is TerminalViewType {
  return view !== null && VALID_VIEWS.includes(view as TerminalViewType);
}

function TerminalPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams.get("view");
  const initialView = isValidView(viewParam) ? viewParam : "terminal";
  const [activeView, setActiveView] = useState<TerminalViewType>(initialView);

  // Sync URL when view changes from dock
  const handleViewChange = (view: TerminalViewType) => {
    setActiveView(view);
    router.replace(`/terminal?view=${view}`, { scroll: false });
  };

  // Sync state when URL changes (e.g., from browser back/forward or direct navigation)
  useEffect(() => {
    if (isValidView(viewParam) && viewParam !== activeView) {
      setActiveView(viewParam);
    }
  }, [viewParam, activeView]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Main Content Area */}
      <div className="h-full w-full overflow-y-auto scrollbar-hide">
        {activeView === "terminal" && <TerminalView />}
        {activeView === "indicators" && <IndicatorsView />}
        {activeView === "sentiment" && <SentimentView />}
        {activeView === "ai-lab" && <AiLabView />}
      </div>

      {/* Dock */}
      <TerminalDock activeView={activeView} onSelect={handleViewChange} />
    </div>
  );
}

export default function TerminalPage() {
  return (
    <ProtectedRoute redirectTo="/login">
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
    </ProtectedRoute>
  );
}
