"use client";

import { GL } from "@/components/gl";
import { useState } from "react";

export function WavyDotBackground() {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="relative">
      <GL hovering={hovering} />
    </div>
  );
}
