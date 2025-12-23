"use client";

import React from "react";
import { motion } from "framer-motion";

export function WaveBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
      {/* Grainy Noise Texture - Essential for the 'Premium' look */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Wave Elements */}
      <div className="absolute inset-0 flex items-center justify-center filter blur-[120px] opacity-40">
        {/* Wave 1 - Large, slow drift */}
        <motion.div
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-[800px] h-[800px] rounded-full bg-linear-to-tr from-white/20 via-white/5 to-transparent left-[-10%] top-[-10%]"
        />

        {/* Wave 2 - Medium, counter movement */}
        <motion.div
          animate={{
            x: [100, -100, 100],
            y: [50, -50, 50],
            scale: [1.2, 1, 1.2],
            rotate: [360, 0, 360],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-[600px] h-[600px] rounded-full bg-linear-to-bl from-white/10 via-zinc-800/20 to-transparent right-[-5%] bottom-[-5%]"
        />

        {/* Wave 3 - Center 'pulse' */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[1000px] h-[1000px] rounded-full bg-radial-at-c from-white/5 to-transparent"
        />

        {/* Darkening overlay for contrast */}
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/20 to-black/60" />
      </div>
    </div>
  );
}
