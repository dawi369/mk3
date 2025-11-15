import { BackgroundProps } from "@/types/bg.types";
/**
 * Background wrapper component with dark horizon glow
 * Background stays fixed in place while content scrolls over it
 */
export function Background({ children }: BackgroundProps) {
  return (
    <div className="min-h-screen w-full relative">
      {/* Dark Horizon Glow - stays fixed while content scrolls */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #000000 40%, #0d1a36 100%)",
          zIndex: -999,
        }}
      />
      {/* Content area */}
      <div className="relative">{children}</div>
    </div>
  );
}
