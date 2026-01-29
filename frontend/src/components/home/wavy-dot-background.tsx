"use client";

import { GL } from "@/components/gl";

interface WavyDotBackgroundProps {
  isHovering?: boolean;
  speed?: number;
  darknessMultiplier?: number;
  blur?: number;
}

export function WavyDotBackground({
  isHovering = false,
  speed = 1,
  darknessMultiplier = 1.0,
  blur = 0,
}: WavyDotBackgroundProps) {
  return (
    <div 
      className="fixed inset-0 z-0"
      style={{
        filter: blur > 0 ? `blur(${blur}px)` : "none",
        transition: "filter 0.3s ease-in-out",
      }}
    >
      <GL hovering={isHovering} speed={speed} darknessMultiplier={darknessMultiplier} />
    </div>
  );
}
