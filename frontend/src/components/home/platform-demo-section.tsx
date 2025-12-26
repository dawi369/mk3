"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

// Vidstack imports for v0.6.x
import "vidstack/styles/defaults.css";
import "vidstack/styles/community-skin/video.css";

import { MediaPlayer, MediaOutlet, MediaPoster, MediaCommunitySkin } from "@vidstack/react";

interface PlatformDemoSectionProps {
  variants?: Variants;
}

export function PlatformDemoSection({ variants }: PlatformDemoSectionProps) {
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
      className="space-y-8"
    >
      {/* Section Header */}
      {/* <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold font-space uppercase tracking-tight">
          See it in{" "}
          <span className="bg-linear-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            Action
          </span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Watch how Swordfish transforms your trading workflow with real-time data and intuitive
          controls.
        </p>
      </div> */}

      {/* Video Player Container */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm shadow-2xl shadow-primary/5">
        {/* Glow Effect Behind Video */}
        <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full pointer-events-none opacity-50" />

        {/* Vidstack Player */}
        <div className="relative">
          <MediaPlayer
            src="/demo_vid.mp4"
            poster="/first_frame_demo_vid.jpg"
            aspectRatio={16 / 9}
            load="idle"
          >
            <MediaOutlet>
              <MediaPoster alt="Swordfish Platform Demo" />
            </MediaOutlet>
            <MediaCommunitySkin />
          </MediaPlayer>
        </div>
      </div>
    </motion.div>
  );
}
