"use client";

import { GL } from "@/components/gl";

interface WavyDotBackgroundProps {
  isHovering?: boolean;
  speed?: number;
  darknessMultiplier?: number;
}

export function WavyDotBackground({
  isHovering = false,
  speed = 0.6,
  darknessMultiplier = 1.0,
}: WavyDotBackgroundProps) {
  return (
    <div className="relative">
      <GL hovering={isHovering} speed={speed} darknessMultiplier={darknessMultiplier} />
    </div>
  );
}
