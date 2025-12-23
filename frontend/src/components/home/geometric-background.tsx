"use client";

import React from "react";

export function GeometricBackground() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* 
        Geometric Pattern Layer
        - Repeating SVG pattern
        - Much more visible white lines
      */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.6'%3E%3Cpath d='M10 10l5 5m-5 0l5-5M30 10h10v10H30zM60 15a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM80 10l10 10M90 10l-10 10M15 40h10M40 40l5 10 5-10M70 40c0 5.5 4.5 10 10 10M10 70c0 10 10 10 10 0M40 70l10 10 10-10M80 80h10v10H80z'/%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Ccircle cx='80' cy='80' r='1'/%3E%3Cpath d='M5 95h90'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Subtle Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/10 to-black/40" />

      {/* Grainy Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
