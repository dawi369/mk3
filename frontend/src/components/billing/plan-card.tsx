"use client";

import { motion } from "framer-motion";
import { Check, X, Sparkles, Zap, Fish } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TierInfo, SubscriptionTier, Subscription } from "@/types/billing.types";
import { TIER_CONFIG, isSubscriptionActive } from "@/types/billing.types";

interface PlanCardProps {
  tier: SubscriptionTier;
  subscription?: Subscription | null;
  onUpgrade?: () => void;
  onManage?: () => void;
  className?: string;
  ctaLabel?: string;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-6 transition-colors duration-200",
        isPro ? "border-primary/30 bg-linear-to-br from-card to-primary/5" : "border-border",
        isCurrentPlan && "ring-2 ring-primary/30",
        className
      )}
    >
      {/* Popular Badge */}
      {config.popular && (
        <div className="absolute -right-8 top-4 rotate-45 bg-primary px-10 py-1 text-xs font-medium text-primary-foreground">
          Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        {/* {isPro ? (
          <Fish className="h-5 w-5 text-primary" />
        ) : (
          <Zap className="h-5 w-5 text-muted-foreground" />
        )} */}
        <h3 className="text-xl font-semibold text-foreground">{config.name}</h3>
        {isCurrentPlan && (
          <Badge 
            variant="secondary" 
            className={cn(
              "ml-auto",
              subscription?.status === "trialing" && "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
            )}
          >
            {subscription?.status === "trialing" ? "Trial Active" : "Current Plan"}
          </Badge>
        )}
      </div>

      {/* Price */}
      <div className="mb-4">
        <span className="text-4xl font-bold text-foreground">{config.priceDisplay}</span>
        <span className="text-muted-foreground">/{config.interval}</span>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm text-muted-foreground">{config.description}</p>

      {/* Features */}
      <ul className="mb-6 space-y-3">
        {config.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            {feature.included ? (
              <Check className="h-4 w-4 text-green" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground/50" />
            )}
            <span className={cn(feature.included ? "text-foreground" : "text-muted-foreground/50")}>
              {feature.name}
              {feature.limit && (
                <span className="ml-1 text-xs text-muted-foreground">({feature.limit})</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      {ctaLabel ? (
        <Button
          variant={isPro ? "default" : "outline"}
          className="w-full"
          onClick={onUpgrade}
        >
          {ctaLabel}
        </Button>
      ) : isCurrentPlan ? (
        <Button variant="outline" className="w-full" onClick={onManage} disabled={tier === "free"}>
          {tier === "free" ? "Current Plan" : "Manage Subscription"}
        </Button>
      ) : (
        <Button variant={isPro ? "default" : "outline"} className="w-full" onClick={onUpgrade}>
          {isPro ? "Upgrade to Pro" : "Downgrade to Free"}
        </Button>
      )}

      {/* Cancel Info */}
      {isCurrentPlan && subscription?.cancelAtPeriodEnd && (
        <p className="mt-3 text-center text-xs text-amber">Cancels at end of billing period</p>
      )}
    </motion.div>
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
  const isActive = isSubscriptionActive(subscription);

  let badgeVariant = "outline";
  let badgeStyles = "border-transparent px-2.5 py-0.5 text-xs font-semibold shadow-none transition-colors";
  let badgeLabel = "Active";

  if (isTrialing) {
    badgeStyles += " bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    badgeLabel = "Trial Active";
  } else if (isPaused) {
    badgeStyles += " bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    badgeLabel = "Paused";
  } else if (isCanceled) {
    badgeStyles += " bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
    badgeLabel = "Canceled";
  } else if (isPastDue || isUnpaid) {
    badgeStyles += " bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    badgeLabel = isPastDue ? "Past Due" : "Unpaid";
  } else {
    // Default Active
    badgeStyles += " bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">{config.name}</h2>
            {tier !== "free" && (
              <Badge variant="outline" className={badgeStyles}>
                {badgeLabel}
              </Badge>
            )}
            {/* Show canceled badge separately if active but scheduled to cancel */}
            {subscription?.cancelAtPeriodEnd && !isCanceled && (
              <Badge variant="secondary">Cancels soon</Badge>
            )}
          </div>
        </div>
        
        {tier !== "free" && (
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium text-muted-foreground">Price</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {config.priceDisplay}
              <span className="text-sm font-normal text-muted-foreground">/{config.interval}</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 border-t pt-6 sm:grid-cols-2">
        {subscription?.currentPeriodEnd && tier !== "free" && (
          <div>
            <p className="text-sm text-muted-foreground">
              {isTrialing 
                ? "Trial ends and renews on" 
                : (subscription.cancelAtPeriodEnd || isCanceled)
                  ? "Access until" 
                  : "Renews on"}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Status Banners - utilizing free space */}
        {isPastDue && (
           <div className="sm:text-right">
            <p className="text-sm font-medium text-red-500 dark:text-red-400">Payment failed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Update payment info to keep Pro access.
            </p>
          </div>
        )}

        {isUnpaid && (
           <div className="sm:text-right">
            <p className="text-sm font-medium text-red-500 dark:text-red-400">Payment failed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Update payment info to renew Pro access.
            </p>
          </div>
        )}

        {isCanceled && (
           <div className="sm:text-right">
            <p className="text-sm font-medium text-muted-foreground">Set to expire</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Enjoy your time left. We'll be here when you're ready.
            </p>
          </div>
        )}

        {status === "active" && !subscription?.cancelAtPeriodEnd && tier !== "free" && !isPaused && (
           <div className="sm:text-right">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">All systems go</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your subscription is active and automated.
            </p>
          </div>
        )}

        
        {isTrialing && tier !== "free" && (
           <div className="sm:text-right">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Test drive active</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Experience the full power of Pro.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
