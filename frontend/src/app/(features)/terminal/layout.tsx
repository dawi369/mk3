"use client";

import { Suspense } from "react";
import { SpotlightProvider } from "@/components/terminal/layout/spotlight/spotlight-provider";
import { Spotlight } from "@/components/terminal/layout/spotlight/spotlight";
import { TickerModalProvider } from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { TickerModal } from "@/components/terminal/ticker-modal/ticker-modal";
import { HeaderProvider } from "@/components/terminal/layout/header-provider";
import { TerminalHeader } from "@/components/terminal/layout/terminal-header";
import { TerminalDock } from "@/components/terminal/layout/terminal-dock";
import { FrontMonthProvider } from "@/providers/front-month-provider";
import { TerminalViewProvider, useTerminalView } from "@/providers/terminal-view-provider";

function TerminalLayoutContent({ children }: { children: React.ReactNode }) {
  const { activeView, setActiveView } = useTerminalView();

  return (
    <div className="flex h-dvh overflow-hidden flex-col relative">
      <TerminalHeader />
      <main className="flex-1 overflow-hidden">{children}</main>
      <Spotlight />
      <TickerModal />
      <TerminalDock activeView={activeView} onSelect={setActiveView} />
    </div>
  );
}

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-screen bg-neutral-950" />}>
      <FrontMonthProvider>
        <TerminalViewProvider>
          <HeaderProvider>
            <SpotlightProvider>
              <TickerModalProvider>
                <TerminalLayoutContent>{children}</TerminalLayoutContent>
              </TickerModalProvider>
            </SpotlightProvider>
          </HeaderProvider>
        </TerminalViewProvider>
      </FrontMonthProvider>
    </Suspense>
  );
}
