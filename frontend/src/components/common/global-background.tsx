"use client";

import { WavyDotBackground } from "@/components/home/wavy-dot-background";
import { useUIStore } from "@/store/use-ui-store";
import { usePathname } from "next/navigation";

/**
 * Global background wrapper that provides the wavy dot background
 * across all pages. On the home page, it runs at normal speed and brightness.
 * On other pages, it runs slower and darker for a subtler effect.
 */
export function GlobalBackground() {
  const pathname = usePathname();
  const { isHoveringBackground } = useUIStore();

  // Don't render on terminal paths - they keep their original background
  if (pathname.startsWith("/terminal")) {
    return null;
  }

  // Home page gets full speed and brightness
  // Other pages get slower (0.5x) and 80% darker (5x multiplier = opacity/5)
  const isHomePage = pathname === "/";

  const speed = isHomePage ? 1.0 : 0.5;
  const darknessMultiplier = isHomePage ? 1.0 : 5.0;

  return (
    <WavyDotBackground
      isHovering={isHoveringBackground}
      speed={speed}
      darknessMultiplier={darknessMultiplier}
    />
  );
}
