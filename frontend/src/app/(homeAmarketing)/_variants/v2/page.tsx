"use client";

import { motion } from "framer-motion";

export default function V2HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold font-space">V2 Experimental Layout</h1>
        <p className="text-muted-foreground">
          This is a placeholder for the experimental home page.
        </p>
        <div className="p-8 border border-dashed border-primary/50 rounded-xl bg-primary/5 italic">
          Coming Soon...
        </div>
      </motion.div>
    </div>
  );
}
