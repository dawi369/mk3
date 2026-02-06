"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Sparkles, ShieldCheck } from "lucide-react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { addToWaitlist } from "@/app/(waitlist)/actions";

const ANIMATION_CONFIG = {
  fadeInUp: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.12 } },
  },
};

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    const result = await addToWaitlist(email);
    setStatus(result);
    setIsLoading(false);

    if (result.success) {
      setEmail("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />
      <BackgroundBeams className="opacity-70" />

      <div className="relative z-10">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-4">
            <Image
              src="/mk3LogoTransparent.png"
              alt="Swordfish"
              width={44}
              height={44}
              className="h-10 w-10"
            />
            <div className="text-sm uppercase tracking-[0.2em] text-white/70">Swordfish</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
            Beta
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial="initial"
            animate="animate"
            variants={ANIMATION_CONFIG.stagger}
            className="flex flex-col justify-center"
          >
            <motion.p
              variants={ANIMATION_CONFIG.fadeInUp}
              className="mb-4 text-xs uppercase tracking-[0.35em] text-white/50"
            >
              Futures Intelligence
            </motion.p>
            <motion.h1
              variants={ANIMATION_CONFIG.fadeInUp}
              className="text-4xl font-bold uppercase leading-[0.9] tracking-tight text-white md:text-6xl lg:text-7xl font-space"
            >
              Signal over noise.
              <span className="block bg-linear-to-b from-white to-white/40 bg-clip-text text-transparent">
                Trade with clarity.
              </span>
            </motion.h1>
            <motion.p
              variants={ANIMATION_CONFIG.fadeInUp}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/65 md:text-lg"
            >
              Swordfish is the professional-grade futures terminal built for speed, context, and
              execution. We are opening access in waves to keep the signal clean and the experience
              elite.
            </motion.p>

            {/* <motion.div
              variants={ANIMATION_CONFIG.fadeInUp}
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              {[
                {
                  title: "Real-time tape",
                  description: "Low-latency bars with live context and clean session math.",
                  icon: Cpu,
                },
                {
                  title: "Institutional context",
                  description: "Market-wide sentiment and volatility cues, in one view.",
                  icon: Sparkles,
                },
                {
                  title: "Built for trust",
                  description: "Measured delivery with careful beta waves and precision QA.",
                  icon: ShieldCheck,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                  </div>
                  <p className="mt-3 text-sm text-white/60">{item.description}</p>
                </div>
              ))}
            </motion.div> */}

            <motion.div
              variants={ANIMATION_CONFIG.fadeInUp}
              className="mt-10 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/40"
            >
              <span>Early Access</span>
              <span className="h-px w-10 bg-white/20" />
              <span>Limited seats</span>
              <span className="h-px w-10 bg-white/20" />
              <span>Priority traders</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 -translate-x-6 translate-y-6 rounded-[32px] bg-linear-to-br from-white/10 via-white/5 to-transparent blur-2xl" />
            <div className="relative rounded-[28px] border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Waitlist</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Join the alpha</h2>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-4 text-sm text-white/60">
                Get early access, product updates, and a priority invite when we open the gates.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/50"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/50 px-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-neutral-950 transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/40"
                >
                  {isLoading ? "Joining..." : "Request Invite"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>

              {status && (
                <p
                  className={`mt-4 text-sm ${
                    status.success ? "text-emerald-300" : "text-red-400"
                  }`}
                >
                  {status.message}
                </p>
              )}

              <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 text-xs text-white/50">
                <div className="flex items-center justify-between">
                  <span>Average invite window</span>
                  <span className="text-white/70">2-4 weeks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Access format</span>
                  <span className="text-white/70">Wave-based rollout</span>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
