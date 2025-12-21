"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { TextLoop } from "@/components/ui/text-loop";
import { ScrambleTitle } from "@/components/home/scramble-title";
import { StatsDisplay } from "@/components/home/stats-display";
import { PlatformDemoSection } from "@/components/home/platform-demo-section";
import { ANIMATION_CONFIG, SCRAMBLE_DELAYS } from "@/app/(homeAmarketing)/constants";

const { fadeInUp, stagger } = ANIMATION_CONFIG;

export default function V1HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden selection:bg-primary/20">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center px-6 pt-20">
        <motion.div
          className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <div className="lg:col-span-7 space-y-8">
            <motion.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl font-bold tracking-tighter font-space text-foreground leading-[0.9]"
            >
              <ScrambleTitle delay={SCRAMBLE_DELAYS.futures}>FUTURES</ScrambleTitle>
              <br />
              <ScrambleTitle delay={SCRAMBLE_DELAYS.tools}>TOOLS</ScrambleTitle>
              <br />
              <ScrambleTitle delay={SCRAMBLE_DELAYS.need}>NEED</ScrambleTitle>
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/50">
                <ScrambleTitle delay={SCRAMBLE_DELAYS.change}>CHANGE.</ScrambleTitle>
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground max-w-xl font-light leading-relaxed"
            >
              <span className="text-foreground font-medium">
                Stop trading with tools built for the past.
              </span>{" "}
              Swordfish delivers institutional-grade futures data, real-time signals, and refined
              insights in an interface designed for
              <span className="text-foreground font-medium"> enhanced intelligence.</span> Power,
              precision, and the
              <span className="text-foreground font-medium"> Best UI in the Game</span>
              —now at your fingertips.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link href="/terminal">
                <button className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:ring-2 hover:ring-primary/20 hover:ring-offset-2 hover:ring-offset-background">
                  <span className="mr-2">Launch Terminal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/mission">
                <button className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  Our Mission
                </button>
              </Link>
            </motion.div>

            <StatsDisplay variants={fadeInUp} />
          </div>

          <div className="lg:col-span-12 lg:col-start-8 lg:absolute lg:-right-24 lg:top-32 lg:w-[800px] pointer-events-none">
            <motion.div variants={fadeInUp} className="relative w-full">
              <Image
                src="/images/home_material_1.png"
                alt="Swordfish Interface"
                width={1600}
                height={1200}
                priority
                className="w-full h-auto object-contain opacity-90 transition-opacity duration-1000 scale-110 lg:scale-125 select-none"
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 relative z-10">
        <motion.div
          className="max-w-7xl mx-auto"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-space mb-6">
              <TextLoop interval={3} className="text-foreground">
                <span>
                  <span className="text-muted-foreground">SEE THE MARKET </span>
                  CLEARLY.
                </span>
                <span>
                  <span className="text-muted-foreground">TRADE WITH </span>
                  PRECISION.
                </span>
                <span>
                  <span className="text-muted-foreground">THINK </span>
                  FASTER.
                </span>
                <span>
                  <span className="text-muted-foreground">STAY </span>
                  AHEAD.
                </span>
              </TextLoop>
            </h2>
          </motion.div>

          <PlatformDemoSection variants={fadeInUp} />
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 border-t border-border/50 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            className="text-5xl md:text-7xl font-bold font-space tracking-tight"
            variants={fadeInUp}
          >
            START TRADING <span className="text-primary">SMARTER.</span>
          </motion.h2>
          <motion.p className="text-xl text-muted-foreground max-w-2xl mx-auto" variants={fadeInUp}>
            Join the new wave of futures traders using Swordfish.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="/terminal">
              <button className="inline-flex h-14 items-center justify-center rounded-full bg-foreground px-10 font-medium text-background transition-transform hover:scale-105 active:scale-95">
                Launch Terminal
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
