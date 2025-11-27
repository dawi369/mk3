"use client";

import { motion } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PlatformDemoSectionProps {
  variants?: any;
}

export function PlatformDemoSection({ variants }: PlatformDemoSectionProps) {
  return (
    <motion.div variants={variants} className="w-full">
      <div className="rounded-xl overflow-hidden border border-border bg-card/30 backdrop-blur-sm p-2">
        <AspectRatio
          ratio={16 / 9}
          className="bg-muted/20 rounded-lg flex items-center justify-center"
        >
          <div className="text-muted-foreground flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-0 h-0 border-t-10 border-t-transparent border-l-20 border-l-primary border-b-10 border-b-transparent ml-1" />
            </div>
            <span className="font-space font-medium tracking-widest uppercase text-sm">
              Platform Demo
            </span>
          </div>
        </AspectRatio>
      </div>
    </motion.div>
  );
}
