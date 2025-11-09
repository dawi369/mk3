/**
 * Configuration for futures contract subscriptions
 * 
 * These values control how many contracts we subscribe to for each asset class.
 * Increasing these values will provide more data coverage but increase costs.
 */

export const SUBSCRIPTION_CONFIG = {
  /**
   * Number of quarterly contracts to subscribe to for US indices
   * Example: 1 = current quarter only, 2 = current + next quarter
   */
  US_INDICES_QUARTERS: 1,
  
  /**
   * Number of monthly contracts to subscribe to for metals
   * Example: 1 = current month only, 2 = current + next month
   */
  METALS_MONTHS: 1,
} as const;

