"use client";

import { motion } from "framer-motion";

const ANIMATION_CONFIG = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.1 } },
  },
};

export default function MissionPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={ANIMATION_CONFIG.stagger}
        >
          {/* Header */}
          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="mb-20 text-center">
            <h1 className="text-4xl font-bold font-space tracking-tight text-foreground md:text-5xl mb-6">
              The Mission, at Swordfish
            </h1>
          </motion.div>

          {/* Content */}
          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-muted-foreground leading-relaxed">
              We're building the financial terminal for the next generation of traders. For too long,
              professional-grade market data has been locked behind prohibitively expensive terminals.
              We believe that information asymmetry shouldn't determine market success. Swordfish eliminates
              the noise, presenting complex data streams in an intuitive, lightning-fast interface that
              lets you focus on the signal, not the setup. We are traders building for traders—no bloat,
              no legacy baggage, just pure performance.
              <br></br>
              <br></br>
              Don't use your grandpa's tools.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
