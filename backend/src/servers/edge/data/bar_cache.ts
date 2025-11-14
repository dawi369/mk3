import type { Bar } from '@/utils/general_types.js';
import { LIMITS } from '@/config/limits.js';

/**
 * In-memory cache for Edge server to store bars received from Redis pub/sub.
 * Keeps last 10,000 bars per symbol (matches Hub's LTRIM limit).
 */
class BarCache {
  private cache: Map<string, Bar[]> = new Map();
  private readonly MAX_BARS = LIMITS.maxEdgeBars;

  /**
   * Set all bars for a symbol (used during initial snapshot load)
   */
  set(symbol: string, bars: Bar[]): void {
    this.cache.set(symbol, bars);
  }

  /**
   * Append a new bar to the cache (used for real-time updates)
   */
  append(bar: Bar): void {
    if (!this.cache.has(bar.symbol)) {
      this.cache.set(bar.symbol, []);
    }

    const bars = this.cache.get(bar.symbol)!;
    bars.push(bar);

    // Keep last 10,000 bars (match Hub's limit)
    if (bars.length > this.MAX_BARS) {
      bars.shift();
    }
  }

  /**
   * Get the most recent bar for a symbol
   */
  getLatest(symbol: string): Bar | undefined {
    const bars = this.cache.get(symbol);
    return bars && bars.length > 0 ? bars[bars.length - 1] : undefined;
  }

  /**
   * Get bars for a symbol, optionally limited to last N bars
   */
  getBars(symbol: string, limit?: number): Bar[] {
    const bars = this.cache.get(symbol) || [];
    return limit ? bars.slice(-limit) : bars;
  }

  /**
   * Get all symbols currently in cache
   */
  getAllSymbols(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): { symbols: number; totalBars: number } {
    let totalBars = 0;
    for (const bars of this.cache.values()) {
      totalBars += bars.length;
    }
    return {
      symbols: this.cache.size,
      totalBars,
    };
  }

  /**
   * Get bars within a time range across all symbols or specific symbols
   * Used for delayed streaming - query bars from virtual time window
   * 
   * @param symbols - Array of symbols to query, or ['*'] for all
   * @param fromTimestamp - Start of time range (inclusive)
   * @param toTimestamp - End of time range (inclusive)
   * @returns Array of bars in time range, sorted chronologically
   */
  getBarsInRange(
    symbols: string[] | Set<string>,
    fromTimestamp: number,
    toTimestamp: number
  ): Bar[] {
    const result: Bar[] = [];
    const symbolSet = symbols instanceof Set ? symbols : new Set(symbols);
    const queryAll = symbolSet.has('*');

    // Iterate through cache
    for (const [symbol, bars] of this.cache) {
      // Filter by subscription
      if (!queryAll && !symbolSet.has(symbol)) {
        continue;
      }

      // Find bars in time range (use endTime for comparison)
      for (const bar of bars) {
        if (bar.endTime >= fromTimestamp && bar.endTime <= toTimestamp) {
          result.push(bar);
        }
      }
    }

    // Sort by endTime to maintain chronological order
    result.sort((a, b) => a.endTime - b.endTime);

    return result;
  }
}

export const barCache = new BarCache();

