"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
// import { GeometricBackground } from "@/components/home/geometric-background";
import { WavyDotBackground } from "@/components/home/wavy-dot-background";
import { useUIStore } from "@/store/use-ui-store";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { isHoveringBackground } = useUIStore();

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      {/* <GeometricBackground /> */}
      <WavyDotBackground isHovering={isHoveringBackground} />
      <Header />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
