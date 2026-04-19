"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  CircleDashed,
  PauseCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionTier, Subscription } from "@/types/billing.types";
import { TIER_CONFIG, isSubscriptionActive } from "@/types/billing.types";

interface PlanCardProps {
  tier: SubscriptionTier;
  subscription?: Subscription | null;
  onUpgrade?: () => void;
  onManage?: () => void;
  className?: string;
  ctaLabel?: string;
}

function getStatusCopy(subscription: Subscription | null) {
  const status = subscription?.status;

  if (status === "trialing") {
    return {
      label: "Trial Running",
      tone: "text-amber",
      note: "Full desk access is live while the trial clock runs.",
      icon: CalendarClock,
    };
  }

  if (status === "paused") {
    return {
      label: "Paused",
      tone: "text-yellow-500",
      note: "Account state is parked until billing resumes.",
      icon: PauseCircle,
    };
  }

  if (status === "past_due" || status === "unpaid" || status === "incomplete") {
    return {
      label: "Action Needed",
      tone: "text-red",
      note: "Billing needs attention before Pro access is reliable.",
      icon: ShieldAlert,
    };
  }

  if (status === "canceled") {
    return {
      label: "Ending",
      tone: "text-muted-foreground",
      note: "Access remains available until the current cycle closes.",
      icon: CircleDashed,
    };
  }

  return {
    label: "Active",
    tone: "text-green",
    note: "Subscription is active and in good standing.",
    icon: ShieldCheck,
  };
}

export function PlanCard({
  tier,
  subscription = null,
  onUpgrade,
  onManage,
  className,
  ctaLabel,
}: PlanCardProps) {
  const config = TIER_CONFIG[tier];
  const isCurrentPlan = subscription?.tier === tier;
  const isPro = tier === "pro";

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_38%,rgba(0,0,0,0.22))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(247,181,0,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_34%)] before:content-['']",
        "after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-white/15 after:content-['']",
        !isPro && "bg-[linear-gradient(160deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)_40%,rgba(0,0,0,0.18))]",
        isCurrentPlan && "ring-1 ring-white/20",
        className
      )}
    >
      <div className="relative space-y-6">
        <div className="space-y-3">
          <div>
            <h3 className="font-space text-3xl font-semibold tracking-[-0.04em] text-white">
              {config.name}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/58">
              {isPro ? "Live terminal access." : config.description}
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/22 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/42">
                Monthly Rate
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-space text-6xl font-semibold leading-none tracking-[-0.06em] text-white [font-variant-numeric:tabular-nums]">
                  {config.priceDisplay}
                </span>
                <span className="pb-2 text-sm uppercase tracking-[0.2em] text-white/48">
                  / {config.interval}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                Terms
              </p>
              <p className="mt-1 text-sm font-medium text-white/86">
                {isCurrentPlan ? "Current" : isPro ? "7-day trial" : "Invite only"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {config.features.map((feature, index) => (
            <div
              key={`${feature.name}-${index}`}
              className={cn(
                "flex min-w-0 items-start gap-3 rounded-2xl border px-4 py-3",
                feature.included
                  ? "border-white/10 bg-white/5 text-white"
                  : "border-white/8 bg-black/10 text-white/38"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  feature.included
                    ? "border-amber/30 bg-amber/12 text-amber"
                    : "border-white/10 bg-white/4 text-white/35"
                )}
              >
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-5">{feature.name}</p>
                {feature.limit && (
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/42">
                    {feature.limit}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {ctaLabel ? (
          <Button
            className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/92"
            onClick={onUpgrade}
          >
            {ctaLabel}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : isCurrentPlan ? (
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl border-white/14 bg-white/4 text-white hover:bg-white/8 hover:text-white"
            onClick={onManage}
            disabled={tier === "free"}
          >
            {tier === "free" ? "Current Plan" : "Manage Subscription"}
          </Button>
        ) : (
          <Button
            className={cn(
              "h-12 w-full rounded-2xl",
              isPro
                ? "bg-white text-black hover:bg-white/92"
                : "border border-white/14 bg-white/4 text-white hover:bg-white/8"
            )}
            onClick={onUpgrade}
          >
            {isPro ? "Start Pro Trial" : "Return To Free"}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        )}

        {isCurrentPlan && subscription?.cancelAtPeriodEnd && (
          <p className="text-center text-xs uppercase tracking-[0.2em] text-amber">
            Subscription ends at the close of the current cycle
          </p>
        )}
      </div>
    </motion.section>
  );
}

interface CurrentPlanSummaryProps {
  subscription: Subscription | null;
  className?: string;
}

export function CurrentPlanSummary({ subscription, className }: CurrentPlanSummaryProps) {
  const tier = subscription?.tier || "free";
  const config = TIER_CONFIG[tier];
  const status = subscription?.status;
  const isTrialing = status === "trialing";
  const isPaused = status === "paused";
  const isCanceled = status === "canceled";
  const isPastDue = status === "past_due";
  const isUnpaid = status === "unpaid";
  const isIncomplete = status === "incomplete";
  const isActive = isSubscriptionActive(subscription);

  const statusTone = isPastDue || isUnpaid
    ? "text-red"
    : isTrialing
      ? "text-amber"
      : isPaused
        ? "text-yellow-500"
        : isIncomplete
          ? "text-amber"
          : "text-green";

  const statusLabel = isTrialing
    ? "Trial Running"
    : isPaused
      ? "Paused"
      : isCanceled
        ? "Canceled"
        : isPastDue
          ? "Past Due"
          : isUnpaid
            ? "Unpaid"
            : isIncomplete
              ? "Incomplete"
              : "Active";

  const cycleLabel = isTrialing
    ? "Trial ends"
    : subscription?.cancelAtPeriodEnd || isCanceled
      ? "Access until"
      : isPastDue || isUnpaid
        ? "Payment due"
        : isIncomplete
          ? "Setup expires"
          : "Renews on";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.18))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/12 before:content-['']",
        className
      )}
    >
      <div className="relative space-y-6">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/42">
            Current Plan
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-space text-4xl font-semibold tracking-[-0.05em] text-white">
              {config.name}
            </h2>
            {tier !== "free" && (
              <Badge className={cn("rounded-full border border-transparent px-3 py-1 text-[10px] uppercase tracking-[0.2em] shadow-none", statusTone, "bg-white/6")}>
                {statusLabel}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/42">
              {cycleLabel}
            </p>
            <p className="mt-3 text-sm font-medium text-white/86">
              {subscription?.currentPeriodEnd && tier !== "free"
                ? new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(subscription.currentPeriodEnd))
                : "No scheduled billing cycle"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/42">
              Access
            </p>
            <p className="mt-3 text-sm font-medium text-white/86">
              {isActive ? "Enabled" : "Limited"}
            </p>
            <p className="mt-1 text-sm text-white/58">
              {isActive ? "Terminal access is available." : "Terminal access is not fully active."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
