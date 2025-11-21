import React from "react";

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
