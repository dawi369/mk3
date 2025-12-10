"use client";

import Link from "next/link";
import Image from "next/image";
import { useHeader } from "@/components/terminal/layout/header-provider";
import { AuthIndicator } from "@/components/common/auth-indicator";

export function TerminalHeader() {
  const { navContent } = useHeader();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center px-4">
        {/* Logo - left aligned, fixed width to balance with auth */}
        <div className="w-50 shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              src="/mk3LogoTransparent.png"
              alt="Swordfish Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>
        </div>

        {/* View-specific nav content - center, takes remaining space */}
        <div className="flex-1 flex items-center justify-center">{navContent}</div>

        {/* Auth indicator - right aligned, same width as logo for balance */}
        <div className="w-40 shrink-0 flex justify-end">
          <AuthIndicator align="right" />
        </div>
      </div>
    </header>
  );
}
