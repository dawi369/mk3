/**
 * Types for front month detection and caching
 */

import type { PolygonAssetClass } from "./polygon.types.js";

/**
 * Information about a single product's front month
 */
export interface FrontMonthInfo {
  /** The front month ticker (e.g., "ESZ5") - highest volume contract */
  frontMonth: string;
  /** Product code (e.g., "ES") */
  productCode: string;
  /** Asset class this product belongs to */
  assetClass: PolygonAssetClass;
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

/**
 * Cached front month data for all products
 */
export interface FrontMonthCache {
  /** Timestamp when data was last updated */
  lastUpdated: number;
  /** Map of product code to front month info */
  products: Record<string, FrontMonthInfo>;
}

/**
 * Status of the front month detection job
 */
export interface FrontMonthJobStatus {
  lastRunTime: number | null;
  lastSuccess: boolean;
  lastError: string | null;
  productsUpdated: number;
  totalRuns: number;
}

/**
 * Polygon snapshot API response types
 */
export interface PolygonSnapshotContract {
  details: {
    ticker: string;
    product_code: string;
    settlement_date: number; // nanoseconds
  };
  session?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    settlement_price?: number;
  };
  last_trade?: {
    price: number;
    size: number;
    last_updated: number;
  };
}

export interface PolygonSnapshotResponse {
  status: string;
  request_id: string;
  results: PolygonSnapshotContract[];
}
