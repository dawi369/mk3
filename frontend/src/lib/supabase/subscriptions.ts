import { createClient } from "@/utils/supabase/client";
import {
  type Subscription,
  type SubscriptionRow,
  type SubscriptionTier,
  rowToSubscription,
} from "@/types/billing.types";

/**
 * Get user's subscription from the subscriptions table
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116: No rows returned (user has no subscription yet)
    if (error.code === "PGRST116") {
      return null;
    }
    console.warn("Error fetching subscription:", error.message || error);
    return null;
  }

  return rowToSubscription(data as SubscriptionRow);
}

/**
 * Create a free subscription for a new user
 */
export async function createFreeSubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      tier: "free" as SubscriptionTier,
      provider: "manual",
      status: "active",
    })
    .select()
    .single();

  if (error) {
    // 23505 = duplicate key (subscription already exists)
    if (error.code === "23505") {
      console.log("Subscription already exists for user:", userId);
      return getUserSubscription(userId);
    }
    console.error("Error creating free subscription:", error);
    return null;
  }

  return rowToSubscription(data as SubscriptionRow);
}

/**
 * Ensure user has a subscription (create free tier if none exists)
 */
export async function ensureUserSubscription(userId: string): Promise<Subscription | null> {
  const existing = await getUserSubscription(userId);
  if (existing) return existing;
  return createFreeSubscription(userId);
}

/**
 * Update subscription payment method info (for display purposes)
 */
export async function updatePaymentMethod(
  userId: string,
  paymentMethod: {
    type: string;
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  }
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      payment_method_type: paymentMethod.type,
      payment_method_last4: paymentMethod.last4,
      payment_method_brand: paymentMethod.brand,
      payment_method_exp_month: paymentMethod.expMonth,
      payment_method_exp_year: paymentMethod.expYear,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating payment method:", error);
    return false;
  }

  return true;
}

/**
 * Update subscription tier and provider info
 * Usually called from webhook handlers
 */
export async function updateSubscription(
  userId: string,
  updates: Partial<{
    tier: SubscriptionTier;
    provider: string;
    providerCustomerId: string;
    providerSubscriptionId: string;
    providerPriceId: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
  }>
): Promise<boolean> {
  const supabase = createClient();

  // Map camelCase to snake_case
  const dbUpdates: Record<string, unknown> = {};
  if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
  if (updates.provider !== undefined) dbUpdates.provider = updates.provider;
  if (updates.providerCustomerId !== undefined)
    dbUpdates.provider_customer_id = updates.providerCustomerId;
  if (updates.providerSubscriptionId !== undefined)
    dbUpdates.provider_subscription_id = updates.providerSubscriptionId;
  if (updates.providerPriceId !== undefined) dbUpdates.provider_price_id = updates.providerPriceId;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.currentPeriodStart !== undefined)
    dbUpdates.current_period_start = updates.currentPeriodStart;
  if (updates.currentPeriodEnd !== undefined)
    dbUpdates.current_period_end = updates.currentPeriodEnd;
  if (updates.cancelAtPeriodEnd !== undefined)
    dbUpdates.cancel_at_period_end = updates.cancelAtPeriodEnd;
  if (updates.canceledAt !== undefined) dbUpdates.canceled_at = updates.canceledAt;

  const { error } = await supabase.from("subscriptions").update(dbUpdates).eq("user_id", userId);

  if (error) {
    console.error("Error updating subscription:", error);
    return false;
  }

  return true;
}
