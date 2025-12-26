"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <Header />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
