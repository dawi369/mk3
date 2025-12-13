/**
 * Types for front month detection API response
 */

export interface FrontMonthInfo {
  /** The front month ticker (e.g., "ESZ5") - highest volume contract */
  frontMonth: string;
  /** Product code (e.g., "ES") */
  productCode: string;
  /** Asset class this product belongs to */
  assetClass: string;
  /** Daily volume of the front month contract */
  volume: number;
  /** Days until expiration of the front month */
  daysToExpiry: number;
  /** The nearest expiry ticker (may differ from frontMonth during roll) */
  nearestExpiry: string;
  /** True if frontMonth differs from nearestExpiry (roll in progress) */
  isRolling: boolean;
  /** Last price of the front month contract */
  lastPrice: number | null;
  /** Settlement/expiry date of the front month */
  expiryDate: string;
}

export interface FrontMonthCache {
  /** Timestamp when data was last updated */
  lastUpdated: number | null;
  /** Map of product code to front month info */
  products: Record<string, FrontMonthInfo>;
  /** Optional message (e.g., when cache is empty) */
  message?: string;
}
