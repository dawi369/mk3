"use client";

import { motion } from "framer-motion";
import { PlanCard } from "@/components/billing/plan-card";
import { ANALYTICS_EVENTS, captureAnalyticsEvent } from "@/lib/analytics";

const ANIMATION_CONFIG = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.1 } },
  },
};

export default function PricingPage() {
  const handleSubscribe = () => {
    captureAnalyticsEvent(ANALYTICS_EVENTS.pricingCtaClicked, {
      tier: "pro",
      cta: "start_free_trial",
      source: "pricing_page",
    });

    window.location.href = "/checkout";
  };

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <motion.div initial="initial" animate="animate" variants={ANIMATION_CONFIG.stagger}>
          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="mb-16 text-center">
            <h1 className="mx-auto max-w-4xl text-balance font-space text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-6xl">
              One plan. Full access.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
              Pro unlocks the live Swordfish terminal.
            </p>
          </motion.div>

          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="mx-auto flex max-w-3xl justify-center">
            <PlanCard
              tier="pro"
              ctaLabel="Start 7-day free trial"
              onUpgrade={handleSubscribe}
              className="w-full"
            />
          </motion.div>

          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Have questions?{" "}
              <a href="mailto:support@swordfish.com" className="underline underline-offset-4 hover:text-foreground">
                Contact support
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
