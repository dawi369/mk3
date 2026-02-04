"use client";

import { useEffect, useState } from "react";
import { WavyDotBackground } from "@/components/home/wavy-dot-background";
import { useUIStore } from "@/store/use-ui-store";
import { usePathname } from "next/navigation";

/**
 * Global background wrapper that provides the wavy dot background
 * across all pages but the /terminal pages. On the home page, it runs at
 * normal speed and brightness. On other pages, it runs slower and darker
 * for a subtler effect.
 *
 * Uses a 400ms delay in both directions to ensure layout animations complete first.
 */
export function GlobalBackground() {
  const pathname = usePathname();
  const { isHoveringBackground } = useUIStore();
  const [shouldRender, setShouldRender] = useState(false);

  const isTerminalPath = pathname.startsWith("/terminal");

  // Delay background render changes to allow layout animations to complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(!isTerminalPath);
    }, 400); // 400ms delay in both directions

    return () => clearTimeout(timer);
  }, [isTerminalPath]);

  // Don't render on terminal paths - they have their own background
  if (!shouldRender) {
    return null;
  }

  // Home page gets full speed and brightness
  // Other pages get slower and darker
  const isHomePage = pathname === "/";

  const speed = isHomePage ? 1.0 : 0.5;
  const darknessMultiplier = isHomePage ? 1.0 : 2.0;
  // Apply a subtle blur on non-home pages to improve text readability
  // const blur = isHomePage ? 0 : 4;
  const blur = 2;

  return (
    <WavyDotBackground
      isHovering={isHoveringBackground}
      speed={speed}
      darknessMultiplier={darknessMultiplier}
      blur={blur}
    />
  );
}
