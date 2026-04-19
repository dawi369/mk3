"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock3, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const ANIMATION_CONFIG = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.1 } },
  },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
      <div className="relative z-10 mx-auto flex max-w-3xl px-6 py-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={ANIMATION_CONFIG.stagger}
          className="w-full"
        >
          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="mb-6">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back
            </Link>
          </motion.div>

          <motion.section
            variants={ANIMATION_CONFIG.fadeInUp}
            className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.18))] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.24)]"
          >
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                <Wrench aria-hidden="true" className="h-5 w-5 text-white/80" />
              </div>

              <div className="space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/42">
                  Checkout
                </p>
                <h1 className="font-space text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
                  WIP
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground">
                  The checkout flow is not wired yet. This page is the placeholder destination for all upgrade
                  buttons until provider checkout is connected.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Clock3 aria-hidden="true" className="h-4 w-4 text-amber" />
                  <p className="text-sm font-medium text-foreground">Current state</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  You can use this route for Monday beta while the payment provider integration is still in progress.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-2xl">
                  <Link href="/billing">Go to Billing</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href="/pricing">Go to Pricing</Link>
                </Button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
