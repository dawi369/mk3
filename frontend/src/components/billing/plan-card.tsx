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
          <Badge variant="secondary" className="ml-auto">
            Current Plan
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
  const isActive = isSubscriptionActive(subscription);

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Current Plan</p>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">{config.name}</h2>
            {isActive && (
              <Badge variant="outline" className="border-green text-green">
                Active
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Billing</p>
          <p className="text-lg font-semibold text-foreground">
            {config.priceDisplay}
            <span className="text-sm font-normal text-muted-foreground">/{config.interval}</span>
          </p>
        </div>
      </div>

      {subscription?.currentPeriodEnd && tier !== "free" && (
        <p className="mt-4 text-sm text-muted-foreground">
          {subscription.cancelAtPeriodEnd ? "Access until" : "Renews on"}{" "}
          {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
