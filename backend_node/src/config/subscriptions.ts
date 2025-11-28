/**
 * Configuration for futures contract subscriptions
 *
 * These values control how many contracts we subscribe to for each asset class.
 * Increasing these values will provide more data coverage but increase costs.
 */

export const SUBSCRIPTION_CONFIG = {
  /**
   * Number of quarterly contracts to subscribe to for US indices
   * Example: 1 = current quarter only, 4 = full year ahead
   */
  US_INDICES_QUARTERS: 1,

  /**
   * Number of quarterly contracts to subscribe to for metals
   * Example: 1 = current quarter only, 4 = full year ahead
   */
  METALS_QUARTERS: 1,

  /**
   * Number of quarterly contracts to subscribe to for currency
   * Example: 1 = current quarter only, 4 = full year ahead
   */
  CURRENCY_QUARTERS: 1,

  /**
   * Number of monthly contracts to subscribe to for grains
   * Example: 1 = current month only, 12 = full year ahead
   */
  GRAINS_MONTHS: 1,

  /**
   * Number of monthly contracts to subscribe to for softs
   * Example: 1 = current month only, 12 = full year ahead
   */
  SOFTS_MONTHS: 1,

  /**
   * Number of monthly contracts to subscribe to for volatiles
   * Example: 1 = current month only, 12 = full year ahead
   */
  VOLATILES_MONTHS: 1,
} as const;
