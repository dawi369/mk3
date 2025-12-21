"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Zap, Shield, BarChart3, Globe, Sparkles, Cpu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ScrambleTitle } from "@/components/home/scramble-title";
import { ANIMATION_CONFIG, SCRAMBLE_DELAYS } from "@/app/(homeAmarketing)/constants";

const { fadeInUp, stagger } = ANIMATION_CONFIG;

export default function V2HomePage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      {/* Aurora / Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[120px] opacity-40 animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] opacity-30 animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "2s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#030303_80%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
      </div>

      <main className="relative z-10">
        {/* Centered Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="max-w-5xl mx-auto space-y-12"
          >
            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-6xl md:text-[7rem] font-bold tracking-tight font-space leading-[0.85] uppercase"
            >
              <span className="block italic font-light text-muted-foreground/60 transition-colors hover:text-white duration-500">
                <ScrambleTitle delay={SCRAMBLE_DELAYS.futures}>Precision</ScrambleTitle>
              </span>
              <span className="block bg-linear-to-b from-white to-white/40 bg-clip-text text-transparent">
                <ScrambleTitle delay={SCRAMBLE_DELAYS.tools}>Intelligence</ScrambleTitle>
              </span>
              <span className="block text-primary">
                <ScrambleTitle delay={SCRAMBLE_DELAYS.need}>Absolute Edge</ScrambleTitle>
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed"
            >
              Swordfish is the new standard in institutional-grade futures trading. Sub-millisecond
              delivery, professional-grade signals, and an interface engineered for the highest
              stakes.
            </motion.p>

            {/* CTA Group */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-6"
            >
              <Link href="/terminal">
                <button className="h-14 px-10 bg-primary text-primary-foreground font-semibold rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                  Start Trading
                  <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/mission">
                <button className="h-14 px-10 border border-white/10 bg-white/5 backdrop-blur-md text-white font-medium rounded-full hover:bg-white/10 transition-colors">
                  The Mission
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Graphic Section */}
          <motion.div
            style={{ y: y1 }}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-24 relative w-full max-w-6xl mx-auto"
          >
            {/* Glow Behind Image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

            <Image
              src="/images/home_material_1.png"
              alt="Swordfish Experimental Interface"
              width={1800}
              height={1000}
              priority
              className="w-full h-auto object-contain select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        </section>

        {/* Bento Feature Section */}
        <section className="py-40 px-6 max-w-7xl mx-auto space-y-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-space uppercase">
              engineered for speed
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Elite features designed for professional futures traders who demand perfection.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Large Card 1: Speed */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-2 relative p-8 rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl overflow-hidden group border-linear-to-b from-white/10 to-transparent"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={120} strokeWidth={1} />
              </div>
              <div className="relative h-full flex flex-col justify-end space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                  <Zap size={24} />
                </div>
                <h3 className="text-3xl font-bold font-space tracking-tight">LATENCY IS LETHAL</h3>
                <p className="text-muted-foreground text-lg max-w-md">
                  Our global edge network delivers direct-to-exchange data with sub-millisecond
                  precision. Never miss a tick.
                </p>
              </div>
            </motion.div>

            {/* Small Card 1: Security */}
            <motion.div
              whileHover={{ y: -5 }}
              className="relative p-8 rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl overflow-hidden group"
            >
              <div className="h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Shield size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-space">FORTRESS</h3>
                  <p className="text-muted-foreground">
                    Institutional security protocols for every user.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Small Card 2: Analytics */}
            <motion.div
              whileHover={{ y: -5 }}
              className="relative p-8 rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl overflow-hidden group"
            >
              <div className="h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <BarChart3 size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-space">SIGNALS</h3>
                  <p className="text-muted-foreground">
                    Real-time sentiment and volume flow analytics.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Large Card 2: Global Reach */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-2 relative p-8 rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl overflow-hidden group"
            >
              <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Globe size={300} strokeWidth={1} />
              </div>
              <div className="relative h-full flex flex-col justify-end space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Globe size={24} />
                </div>
                <h3 className="text-3xl font-bold font-space tracking-tight">GLOBAL LIQUIDITY</h3>
                <p className="text-muted-foreground text-lg max-w-md">
                  Connect to over 100 global futures markets through a single, unified interface.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-60 px-6 relative overflow-visible">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center space-y-10"
          >
            <h2 className="text-6xl md:text-8xl font-bold font-space tracking-tighter uppercase leading-none">
              The Trade <br />
              <span className="text-primary italic">Starts Here</span>
            </h2>
            <p className="text-xl text-muted-foreground font-light max-w-xl mx-auto">
              Elevate your execution with the most advanced futures terminal ever created.
            </p>
            <div className="flex justify-center pt-8">
              <Link href="/terminal">
                <button className="group h-16 px-16 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-xl flex items-center gap-3">
                  Open Terminal
                  <ArrowRight
                    size={24}
                    className="group-hover:translate-x-2 transition-transform"
                  />
                </button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
