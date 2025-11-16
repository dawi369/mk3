import type { FC, ReactNode } from "react";

type Bg3Props = {
  children?: ReactNode;
  className?: string;
};

// Subtle dark grid with soft radial glow
export const Bg3: FC<Bg3Props> = ({ children, className }) => {
  return (
    <div className={`min-h-screen w-full relative ${className ?? ""}`}>
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "#020617",
          backgroundImage: `
            linear-gradient(to right, rgba(71,85,105,0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(71,85,105,0.3) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)
          `,
          backgroundSize: "32px 32px, 32px 32px, 100% 100%",
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col min-h-screen text-foreground">
        {children}
      </div>
    </div>
  );
};
