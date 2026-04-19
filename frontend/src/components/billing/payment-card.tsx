"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardBrand, PaymentMethod } from "@/types/billing.types";

interface PaymentCardProps {
  paymentMethod: PaymentMethod;
  cardHolder?: string;
  isActive?: boolean;
  className?: string;
}

const CARD_BRAND_ICONS: Record<CardBrand, React.ReactNode> = {
  visa: (
    <svg aria-hidden="true" viewBox="0 0 48 32" className="h-8 w-12" fill="currentColor">
      <path
        fill="#1A1F71"
        d="M19.5 24.3l1.9-11.6h3l-1.9 11.6h-3zm12.4-11.3c-.6-.2-1.5-.5-2.7-.5-3 0-5.1 1.5-5.1 3.7 0 1.6 1.5 2.5 2.6 3 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-1.9-.2-3-.6l-.4-.2-.4 2.6c.7.3 2.1.6 3.5.6 3.2 0 5.3-1.5 5.3-3.8 0-1.3-.8-2.3-2.6-3.1-1.1-.5-1.7-.9-1.7-1.4 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.4-2.5zm7.9-.3h-2.3c-.7 0-1.3.2-1.6 1l-4.5 10.6h3.2l.6-1.7h3.9l.4 1.7h2.8l-2.5-11.6zm-3.7 7.5c.3-.7 1.2-3.2 1.2-3.2l.4-1 .2.9s.6 2.8.7 3.3h-2.5zM17.3 12.7l-3 7.9-.3-1.5c-.5-1.8-2.2-3.8-4.1-4.8l2.7 10.1h3.2l4.8-11.6h-3.3v-.1z"
      />
      <path
        fill="#F9A51A"
        d="M11.8 12.7H6.7l-.1.3c3.8.9 6.3 3.2 7.4 5.9l-1.1-5.2c-.2-.8-.7-1-1.1-1z"
      />
    </svg>
  ),
  mastercard: (
    <svg aria-hidden="true" viewBox="0 0 48 32" className="h-8 w-12">
      <circle cx="18" cy="16" r="10" fill="#EB001B" />
      <circle cx="30" cy="16" r="10" fill="#F79E1B" />
      <path
        d="M24 8.5c2.4 1.8 4 4.6 4 7.5s-1.6 5.7-4 7.5c-2.4-1.8-4-4.6-4-7.5s1.6-5.7 4-7.5z"
        fill="#FF5F00"
      />
    </svg>
  ),
  amex: (
    <svg aria-hidden="true" viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#006FCF" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
        AMEX
      </text>
    </svg>
  ),
  discover: (
    <svg aria-hidden="true" viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#FF6000" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
        DISCOVER
      </text>
    </svg>
  ),
  diners: (
    <svg aria-hidden="true" viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#0079BE" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
        DINERS
      </text>
    </svg>
  ),
  jcb: (
    <svg aria-hidden="true" viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#0E4C96" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
        JCB
      </text>
    </svg>
  ),
  unionpay: (
    <svg aria-hidden="true" viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#1A1F71" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
        UnionPay
      </text>
    </svg>
  ),
  unknown: (
    <svg aria-hidden="true" viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#666" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="8">
        CARD
      </text>
    </svg>
  ),
};

const ChipIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 40 30" className="h-6 w-8 text-white/48">
    <rect
      x="1"
      y="1"
      width="38"
      height="28"
      rx="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    />
    <rect x="8" y="5" width="8" height="20" fill="currentColor" opacity="0.28" />
    <rect x="18" y="5" width="6" height="20" fill="currentColor" opacity="0.2" />
    <rect x="26" y="8" width="6" height="14" fill="currentColor" opacity="0.14" />
  </svg>
);

function formatMaskedNumber(last4: string) {
  return ["••••", "••••", "••••", last4].join("  ");
}

export function PaymentCard({
  paymentMethod,
  cardHolder = "Card Holder",
  isActive = false,
  className,
}: PaymentCardProps) {
  const brand = paymentMethod.brand || "unknown";
  const last4 = paymentMethod.last4 || "0000";
  const expMonth = paymentMethod.expMonth?.toString().padStart(2, "0") || "••";
  const expYear = paymentMethod.expYear
    ? (paymentMethod.expYear % 100).toString().padStart(2, "0")
    : "••";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025)_40%,rgba(0,0,0,0.25))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),linear-gradient(180deg,transparent,rgba(0,0,0,0.18))] before:content-['']",
        "after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,transparent_0,rgba(255,255,255,0.03)_50%,transparent_100%)] after:content-['']",
        isActive ? "ring-1 ring-amber/30" : "",
        className
      )}
    >
      <div className="relative space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/42">
              Payment Method
            </p>
            <p className="mt-2 text-sm font-medium capitalize text-white/82">
              {paymentMethod.type === "unknown" ? "Card" : paymentMethod.type}
            </p>
          </div>
          {isActive && (
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Active
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <ChipIcon />
          <div className="flex items-center justify-end">{CARD_BRAND_ICONS[brand]}</div>
        </div>

        <div>
          <p className="font-mono text-lg tracking-[0.34em] text-white [font-variant-numeric:tabular-nums] sm:text-xl">
            {formatMaskedNumber(last4)}
          </p>
        </div>

        <div className="grid grid-cols-[1.3fr_0.7fr] gap-4 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">
              Card Holder
            </p>
            <p className="mt-1 truncate text-sm font-medium text-white/86">{cardHolder}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">
              Expires
            </p>
            <p className="mt-1 text-sm font-medium text-white/86">
              {expMonth}/{expYear}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function EmptyPaymentCard({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex h-[240px] flex-col justify-between rounded-[28px] border border-dashed border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5",
        className
      )}
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/42">
          Payment Method
        </p>
        <p className="mt-3 text-lg font-medium text-white/86">No card on file</p>
      </div>

        <div className="space-y-2">
          <p className="text-sm leading-6 text-white/58">
            Add a billing method when you are ready to move onto a paid plan.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/36">
            Upgrade flow not yet connected
          </p>
        </div>
    </motion.div>
  );
}
