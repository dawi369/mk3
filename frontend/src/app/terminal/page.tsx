"use client";

import { motion } from "framer-motion";
import { AssetClassSection } from "@/components/terminal/asset-class-section";
import { SentimentPanel } from "@/components/terminal/sentiment-panel";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Configuration for the 6 asset class sections
const assetSections = [
  {
    title: "US Indices",
    tickers: ["ES", "NQ", "YM", "RTY", "MES", "MNQ"],
  },
  {
    title: "Currencies",
    tickers: ["6E", "6B", "6J", "6A", "6C", "6S"],
  },
  {
    title: "Grains",
    tickers: ["ZC", "ZW", "ZS", "ZM", "ZL", "ZO"],
  },
  {
    title: "Metals",
    tickers: ["GC", "SI", "HG", "PL", "PA", "MGC"],
  },
  {
    title: "Softs",
    tickers: ["SB", "KC", "CC", "CT", "OJ", "LSU"],
  },
  {
    title: "Volatiles",
    tickers: ["VX", "BTC", "ETH", "MBT", "MET", "RBOB"],
  },
];

export default function TerminalPage() {
  return (
    <div className="min-h-screen bg-background p-6 pt-24 pb-12">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div
            variants={fadeInUp}
            className="flex items-end justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold font-space tracking-tight">
                Market Overview
              </h1>
              <p className="text-muted-foreground mt-2">
                Real-time global market intelligence.
              </p>
            </div>
            <div className="text-sm font-mono text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Connected
            </div>
          </motion.div>

          {/* Sentiment Panel */}
          <motion.div variants={fadeInUp}>
            <SentimentPanel />
          </motion.div>

          {/* Asset Class Grid */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {assetSections.map((section) => (
              <AssetClassSection
                key={section.title}
                title={section.title}
                tickers={section.tickers}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
