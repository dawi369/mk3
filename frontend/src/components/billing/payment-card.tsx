"use client";

import { motion } from "framer-motion";
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
    <svg viewBox="0 0 48 32" className="h-8 w-12" fill="currentColor">
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
    <svg viewBox="0 0 48 32" className="h-8 w-12">
      <circle cx="18" cy="16" r="10" fill="#EB001B" />
      <circle cx="30" cy="16" r="10" fill="#F79E1B" />
      <path
        d="M24 8.5c2.4 1.8 4 4.6 4 7.5s-1.6 5.7-4 7.5c-2.4-1.8-4-4.6-4-7.5s1.6-5.7 4-7.5z"
        fill="#FF5F00"
      />
    </svg>
  ),
  amex: (
    <svg viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#006FCF" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
        AMEX
      </text>
    </svg>
  ),
  discover: (
    <svg viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#FF6000" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
        DISCOVER
      </text>
    </svg>
  ),
  diners: (
    <svg viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#0079BE" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
        DINERS
      </text>
    </svg>
  ),
  jcb: (
    <svg viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#0E4C96" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
        JCB
      </text>
    </svg>
  ),
  unionpay: (
    <svg viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#1A1F71" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
        UnionPay
      </text>
    </svg>
  ),
  unknown: (
    <svg viewBox="0 0 48 32" className="h-8 w-12">
      <rect fill="#666" width="48" height="32" rx="4" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="8">
        CARD
      </text>
    </svg>
  ),
};

const ChipIcon = () => (
  <svg viewBox="0 0 40 30" className="h-6 w-8 text-muted-foreground/50">
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
    <rect x="8" y="5" width="8" height="20" fill="currentColor" opacity="0.3" />
    <rect x="18" y="5" width="6" height="20" fill="currentColor" opacity="0.2" />
    <rect x="26" y="8" width="6" height="14" fill="currentColor" opacity="0.15" />
  </svg>
);

export function PaymentCard({
  paymentMethod,
  cardHolder = "Card Holder",
  isActive = false,
  className,
}: PaymentCardProps) {
  const brand = paymentMethod.brand || "unknown";
  const last4 = paymentMethod.last4 || "••••";
  const expMonth = paymentMethod.expMonth?.toString().padStart(2, "0") || "••";
  const expYear = paymentMethod.expYear
    ? (paymentMethod.expYear % 100).toString().padStart(2, "0")
    : "••";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-200",
        isActive
          ? "border-primary/50 ring-2 ring-primary/20"
          : "border-border hover:border-border/80",
        className
      )}
    >
      {/* Card Type Label */}
      <div className="mb-4">
        <span className="text-xs font-medium text-muted-foreground">Credit</span>
      </div>

      {/* Chip Icon */}
      <div className="mb-4">
        <ChipIcon />
      </div>

      {/* Card Number */}
      <div className="mb-4">
        <p className="font-mono text-lg font-medium tracking-wider text-foreground">
          •••• {last4.slice(-4).padStart(4, "•")} {last4} {last4}
        </p>
      </div>

      {/* Card Details Row */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Card Holder</p>
          <p className="text-sm font-medium text-foreground">{cardHolder}</p>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-xs text-muted-foreground">Expires</p>
          <p className="text-sm font-medium text-foreground">
            {expMonth}/{expYear}
          </p>
        </div>
        <div className="flex items-center justify-end">{CARD_BRAND_ICONS[brand]}</div>
      </div>
    </motion.div>
  );
}

/**
 * Empty state when no payment method is set
 */
export function EmptyPaymentCard({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative flex h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-5",
        className
      )}
    >
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">No payment method</p>
        <p className="text-xs text-muted-foreground/70">Add a card to upgrade</p>
      </div>
    </motion.div>
  );
}
