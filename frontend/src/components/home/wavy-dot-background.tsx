"use client";

import { GL } from "@/components/gl";
import { useState } from "react";

export function WavyDotBackground({ isHovering = false }: { isHovering?: boolean }) {
  return (
    <div className="relative">
      <GL hovering={isHovering} />
    </div>
  );
}
