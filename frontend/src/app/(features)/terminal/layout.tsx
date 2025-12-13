"use client";

import Link from "next/link";
import Image from "next/image";
import { SpotlightProvider } from "@/components/terminal/layout/spotlight/spotlight-provider";
import { Spotlight } from "@/components/terminal/layout/spotlight/spotlight";
import { TickerModalProvider } from "@/components/terminal/ticker-modal/ticker-modal-provider";
import { TickerModal } from "@/components/terminal/ticker-modal/ticker-modal";
import { HeaderProvider } from "@/components/terminal/layout/header-provider";
import { TerminalHeader } from "@/components/terminal/layout/terminal-header";
import { FrontMonthProvider } from "@/providers/front-month-provider";

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <FrontMonthProvider>
      <HeaderProvider>
        <SpotlightProvider>
          <TickerModalProvider>
            <div className="flex h-dvh overflow-hidden flex-col">
              <TerminalHeader />
              <main className="flex-1 overflow-hidden">{children}</main>
              <Spotlight />
              <TickerModal />
            </div>
          </TickerModalProvider>
        </SpotlightProvider>
      </HeaderProvider>
    </FrontMonthProvider>
  );
}
