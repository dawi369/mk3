"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Receipt, Settings2, Plus } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { PaymentCard } from "@/components/billing/payment-card";
import { EmptyPaymentCard } from "@/components/billing/payment-card";
import { PlanCard } from "@/components/billing/plan-card";
import { CurrentPlanSummary } from "@/components/billing/plan-card";
import { TransactionTable } from "@/components/billing/transaction-table";
import { getUserSubscription, ensureUserSubscription } from "@/lib/supabase/subscriptions";
import type { Subscription, Transaction } from "@/types/billing.types";

const ANIMATION_CONFIG = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.1 } },
  },
};

export default function BillingPage() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Ensure user has a subscription (creates free tier if none)
        const sub = await ensureUserSubscription(user.id);
        setSubscription(sub);

        // TODO: Load transactions from billing provider
        // For now, empty array (will be populated via webhook data)
        setTransactions([]);
      } catch (error) {
        console.error("Error loading subscription:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [user]);

  const handleUpgrade = () => {
    // TODO: Implement checkout flow
    // This will call billingService.getCheckoutUrl() once provider is configured
    console.log("Upgrade clicked - implement checkout flow");
  };

  const handleManage = () => {
    // TODO: Implement portal flow
    // This will call billingService.getPortalUrl() once provider is configured
    console.log("Manage clicked - implement portal flow");
  };

  const handleAddPaymentMethod = () => {
    // TODO: Implement add payment method flow
    console.log("Add payment method clicked");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Background Grid Effect */}
      {/* <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
      </div> */}

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <motion.div initial="initial" animate="animate" variants={ANIMATION_CONFIG.stagger}>
          {/* Header */}
          <motion.header variants={ANIMATION_CONFIG.fadeInUp} className="mb-10">
            <h1 className="text-4xl font-bold font-space tracking-tight text-foreground">
              Billing
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your subscription and payment methods
            </p>
          </motion.header>

          {/* Current Plan Summary */}
          <motion.section variants={ANIMATION_CONFIG.fadeInUp} className="mb-10">
            <CurrentPlanSummary subscription={subscription} />
          </motion.section>

          {/* Payment Methods Section */}
          <motion.section variants={ANIMATION_CONFIG.fadeInUp} className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">Payment Methods</h2>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddPaymentMethod}>
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subscription?.paymentMethod ? (
                <PaymentCard
                  paymentMethod={subscription.paymentMethod}
                  cardHolder={profile?.display_name || user?.email || "Card Holder"}
                  isActive
                />
              ) : (
                <EmptyPaymentCard />
              )}
            </div>
          </motion.section>

          {/* Plans Comparison */}
          <motion.section variants={ANIMATION_CONFIG.fadeInUp} className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Plans</h2>
            </div>
            <div className="flex justify-center max-w-md mx-auto">
              <PlanCard
                tier="pro"
                subscription={subscription}
                onUpgrade={handleUpgrade}
                onManage={handleManage}
                className="w-full"
              />
            </div>
          </motion.section>

          {/* Transaction History */}
          <motion.section variants={ANIMATION_CONFIG.fadeInUp}>
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
            </div>
            <TransactionTable transactions={transactions} />
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
