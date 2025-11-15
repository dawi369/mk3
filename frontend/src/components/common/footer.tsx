import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="py-6 text-center text-muted-foreground text-xs select-none">
      © {new Date().getFullYear()} Swordfish. All rights reserved.
      <div className="mt-2 flex items-center justify-center gap-3">
        <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
        <span className="text-muted-foreground/40">•</span>
        <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
      </div>
    </footer>
  );
};
