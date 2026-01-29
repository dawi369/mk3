"use client";
import React, { useState } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { addToWaitlist } from "@/app/(waitlist)/actions";

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
    <div className="h-screen w-full rounded-md bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="relative z-10 text-lg md:text-7xl bg-clip-text text-transparent bg-linear-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold">
          Join the Waitlist
        </h1>
        <p className="text-neutral-400 max-w-lg mx-auto my-2 text-base text-center relative z-10">
          Be first to experience Swordfish — the professional high-fidelity
          terminal for futures traders. Real-time data, market-wide contextual
          sentiment, AI-driven labs, and precision backtesting. Turn market
          noise into institutional clarity.
        </p>
        <form onSubmit={handleSubmit} className="relative z-10 mt-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={isLoading}
            className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-neutral-500 w-full bg-neutral-950 placeholder:text-neutral-700 p-3 text-neutral-200"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 w-full bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? "Joining..." : "Join Waitlist"}
          </button>
        </form>
        {status && (
          <p
            className={`mt-4 text-sm text-center relative z-10 ${
              status.success ? "text-teal-400" : "text-red-400"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
      <BackgroundBeams />
    </div>
  );
}
