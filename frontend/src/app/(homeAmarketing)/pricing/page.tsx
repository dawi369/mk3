"use client";

import { motion } from "framer-motion";
import { PlanCard } from "@/components/billing/plan-card";

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
  const handleGetStarted = () => {
    // TODO: Redirect to signup or login
    window.location.href = "/auth/sign-up";
  };

  const handleSubscribe = () => {
    // TODO: Redirect to signup with pro intent
    window.location.href = "/auth/sign-up?plan=pro";
  };

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <motion.div initial="initial" animate="animate" variants={ANIMATION_CONFIG.stagger}>
          {/* Header */}
          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="mb-16 text-center">
            <h1 className="text-4xl font-bold font-space tracking-tight text-foreground md:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="flex justify-center max-w-md mx-auto">
            <PlanCard
              tier="pro"
              ctaLabel="Start 7-day free trial"
              onUpgrade={handleSubscribe}
              className="w-full"
            />
          </motion.div>

          {/* FAQ or Trust Section could go here */}
          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Have questions? <a href="mailto:support@swordfish.com" className="underline underline-offset-4 hover:text-foreground">Contact support</a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
