"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Zap,
  BarChart3,
  ArrowRight,
  Activity,
  Globe,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { MarketStatus } from "@/components/ui/market-status";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

import { TextScramble } from "@/components/ui/text-scramble";
import { useState, useEffect } from "react";

function ScrambleTitle({
  children,
  className,
  delay = 0,
}: {
  children: string;
  className?: string;
  delay?: number;
}) {
  const [trigger, setTrigger] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrigger(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <TextScramble
      className={className}
      as="span"
      trigger={trigger}
      loop={isHovering}
      onHoverStart={() => {
        setTrigger(true);
        setIsHovering(true);
      }}
      onHoverEnd={() => setIsHovering(false)}
      onScrambleComplete={() => setTrigger(false)}
    >
      {children}
    </TextScramble>
  );
}

export default function Home() {
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
            <motion.div variants={fadeInUp}>
              <MarketStatus />
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl font-bold tracking-tighter font-space text-foreground leading-[0.9]"
            >
              <ScrambleTitle delay={200}>FUTURES.</ScrambleTitle>
              <br />
              <ScrambleTitle delay={400}>FOCUSED.</ScrambleTitle>
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/50">
                <ScrambleTitle delay={600}>FAST.</ScrambleTitle>
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground max-w-xl font-light leading-relaxed"
            >
              Swordfish transforms institutional futures data into refined
              insights, real-time signals, and a seamless trading
              experience—giving every serious trader access to power once
              reserved for the pros. With the
              <span className="text-foreground font-medium">
                {" "}
                Best UI in Futures Trading
              </span>
              , we makes professional-grade performance feel effortless.
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

            <motion.div
              variants={fadeInUp}
              className="pt-8 grid grid-cols-3 gap-8 border-t border-border/50"
            >
              <div>
                <div className="text-3xl font-bold font-space">50+</div>
                <div className="text-xs text-muted-foreground font-mono uppercase mt-1">
                  Global Futures Exchanges
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold font-space">10ms</div>
                <div className="text-xs text-muted-foreground font-mono uppercase mt-1">
                  Latency
                </div>
              </div>
              {/* <div>
                <div className="text-3xl font-bold font-space">Full</div>
                <div className="text-xs text-muted-foreground font-mono uppercase mt-1">
                  Full L2/L3 Order Book
                </div>
              </div> */}
              <div>
                <div className="text-3xl font-bold font-space">AI-Driven</div>
                <div className="text-xs text-muted-foreground font-mono uppercase mt-1">
                  Edge
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 relative">
            <motion.div
              variants={fadeInUp}
              className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-2xl"
            >
              {/* Abstract Trading UI */}
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
                  </div>
                  <div className="text-muted-foreground">
                    this is temp ESZ25 • CME
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">BID</div>
                    <div className="text-2xl text-green-500 font-bold">
                      4501.25
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vol: 125
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="text-xs text-muted-foreground">ASK</div>
                    <div className="text-2xl text-red-500 font-bold">
                      4501.50
                    </div>
                    <div className="text-xs text-muted-foreground">Vol: 84</div>
                  </div>
                </div>

                <div className="h-32 flex items-end gap-1 pt-4 border-t border-border/50 opacity-50">
                  {[
                    40, 65, 45, 80, 55, 70, 40, 60, 50, 75, 60, 85, 70, 90, 65,
                  ].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
              </div>
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
              INTELLIGENCE{" "}
              <span className="text-muted-foreground">BUILT IN.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Card */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-2 p-8 rounded-2xl border border-border bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors group"
            >
              <div className="h-full flex flex-col justify-between">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-space mb-3">
                    Real-time Analytics
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Process thousands of data points per second with our
                    advanced aggregation engine. Visualize market depth and
                    order flow in real-time.
                  </p>
                </div>
                <div className="w-full h-32 bg-linear-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-size-[250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
                </div>
              </div>
            </motion.div>

            {/* Tall Card */}
            <motion.div
              variants={fadeInUp}
              className="md:row-span-2 p-8 rounded-2xl border border-border bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold font-space mb-3">
                Global Coverage
              </h3>
              <p className="text-muted-foreground mb-8">
                Access futures markets across CME, CBOT, ICE?, COMEX, and NYMEX.
              </p>
              <div className="space-y-4 font-mono text-sm">
                {[
                  "ES (S&P 500)",
                  "ZC (Corn)",
                  "BZ (Brent)?",
                  "GC (Gold)",
                  "CL (Crude)",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-border/50"
                  >
                    <span className="text-muted-foreground">{item}</span>
                    <span className="text-green-500">● Active</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Small Card 1 */}
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-2xl border border-border bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-space mb-2">Low Latency</h3>
              <p className="text-muted-foreground text-sm">
                Direct market access with sub-millisecond execution times.
              </p>
            </motion.div>

            {/* Small Card 2 */}
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-2xl border border-border bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-space mb-2">
                Enterprise Security
              </h3>
              <p className="text-muted-foreground text-sm">
                Bank-grade encryption and secure authentication protocols.
              </p>
            </motion.div>
          </div>
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
            READY TO <span className="text-primary">DIVE IN?</span>
          </motion.h2>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            Join the elite traders who trust Swordfish for their daily
            operations.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="/login">
              <button className="inline-flex h-14 items-center justify-center rounded-full bg-foreground px-10 font-medium text-background transition-transform hover:scale-105 active:scale-95">
                Get Started Now
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
