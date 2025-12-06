/**
 * Billing Service Layer
 *
 * Modular adapter pattern for billing providers.
 * Easy to swap between Stripe, LemonSqueezy, or Paddle.
 */

import type { SubscriptionTier } from "@/types/billing.types";

// ============================================================================
// Billing Adapter Interface
// ============================================================================

export interface BillingAdapter {
  readonly name: string;

  /**
   * Get a checkout URL to start a subscription
   */
  getCheckoutUrl(params: {
    userId: string;
    email: string;
    tier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string>;

  /**
   * Get a customer portal URL to manage subscription
   */
  getPortalUrl(params: { customerId: string; returnUrl: string }): Promise<string>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string): Promise<void>;

  /**
   * Resume a canceled subscription (if within grace period)
   */
  resumeSubscription(subscriptionId: string): Promise<void>;
}

// ============================================================================
// Stripe Adapter (Stub - implement when ready)
// ============================================================================

export class StripeAdapter implements BillingAdapter {
  readonly name = "stripe";

  async getCheckoutUrl(params: {
    userId: string;
    email: string;
    tier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    // TODO: Implement Stripe checkout
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({...})
    // return session.url;
    console.warn("Stripe adapter not implemented");
    throw new Error("Stripe adapter not implemented");
  }

  async getPortalUrl(params: { customerId: string; returnUrl: string }): Promise<string> {
    // TODO: Implement Stripe customer portal
    console.warn("Stripe adapter not implemented");
    throw new Error("Stripe adapter not implemented");
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // TODO: Implement Stripe cancellation
    console.warn("Stripe adapter not implemented");
    throw new Error("Stripe adapter not implemented");
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    // TODO: Implement Stripe resume
    console.warn("Stripe adapter not implemented");
    throw new Error("Stripe adapter not implemented");
  }
}

// ============================================================================
// LemonSqueezy Adapter (Stub - implement when ready)
// ============================================================================

export class LemonSqueezyAdapter implements BillingAdapter {
  readonly name = "lemonsqueezy";

  async getCheckoutUrl(params: {
    userId: string;
    email: string;
    tier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    // TODO: Implement LemonSqueezy checkout
    // Use LemonSqueezy checkout overlay or redirect
    console.warn("LemonSqueezy adapter not implemented");
    throw new Error("LemonSqueezy adapter not implemented");
  }

  async getPortalUrl(params: { customerId: string; returnUrl: string }): Promise<string> {
    // TODO: Implement LemonSqueezy customer portal
    console.warn("LemonSqueezy adapter not implemented");
    throw new Error("LemonSqueezy adapter not implemented");
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    console.warn("LemonSqueezy adapter not implemented");
    throw new Error("LemonSqueezy adapter not implemented");
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    console.warn("LemonSqueezy adapter not implemented");
    throw new Error("LemonSqueezy adapter not implemented");
  }
}

// ============================================================================
// Paddle Adapter (Stub - implement when ready)
// ============================================================================

export class PaddleAdapter implements BillingAdapter {
  readonly name = "paddle";

  async getCheckoutUrl(params: {
    userId: string;
    email: string;
    tier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    // TODO: Implement Paddle checkout
    // Use Paddle.js overlay
    console.warn("Paddle adapter not implemented");
    throw new Error("Paddle adapter not implemented");
  }

  async getPortalUrl(params: { customerId: string; returnUrl: string }): Promise<string> {
    // TODO: Implement Paddle customer portal
    console.warn("Paddle adapter not implemented");
    throw new Error("Paddle adapter not implemented");
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    console.warn("Paddle adapter not implemented");
    throw new Error("Paddle adapter not implemented");
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    console.warn("Paddle adapter not implemented");
    throw new Error("Paddle adapter not implemented");
  }
}

// ============================================================================
// Billing Service
// ============================================================================

export type BillingProviderType = "stripe" | "lemonsqueezy" | "paddle";

const adapters: Record<BillingProviderType, BillingAdapter> = {
  stripe: new StripeAdapter(),
  lemonsqueezy: new LemonSqueezyAdapter(),
  paddle: new PaddleAdapter(),
};

/**
 * Get the configured billing adapter
 */
export function getBillingAdapter(provider: BillingProviderType = "stripe"): BillingAdapter {
  return adapters[provider];
}

/**
 * Billing service singleton
 *
 * Usage:
 * ```ts
 * import { billingService } from '@/lib/billing/billing-service';
 *
 * const checkoutUrl = await billingService.getCheckoutUrl({...});
 * ```
 */
export const billingService = {
  /**
   * Get checkout URL using the configured provider
   */
  async getCheckoutUrl(
    params: Parameters<BillingAdapter["getCheckoutUrl"]>[0],
    provider: BillingProviderType = "stripe"
  ): Promise<string> {
    return getBillingAdapter(provider).getCheckoutUrl(params);
  },

  /**
   * Get portal URL using the configured provider
   */
  async getPortalUrl(
    params: Parameters<BillingAdapter["getPortalUrl"]>[0],
    provider: BillingProviderType = "stripe"
  ): Promise<string> {
    return getBillingAdapter(provider).getPortalUrl(params);
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    provider: BillingProviderType = "stripe"
  ): Promise<void> {
    return getBillingAdapter(provider).cancelSubscription(subscriptionId);
  },

  /**
   * Resume subscription
   */
  async resumeSubscription(
    subscriptionId: string,
    provider: BillingProviderType = "stripe"
  ): Promise<void> {
    return getBillingAdapter(provider).resumeSubscription(subscriptionId);
  },
};
