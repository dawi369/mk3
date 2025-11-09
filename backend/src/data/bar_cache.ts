import type { Bar } from '@/utils/types.js';

/**
 * In-memory cache for today's bars with memory limits and sampling
 */
export class BarCache {
  private cache: Map<string, Bar[]> = new Map();
  private barCount = 0;
  private alertedMemory = false;

  private readonly MAX_BARS_PER_SYMBOL = 10000;
  private readonly MAX_MEMORY_BYTES = 1024 * 1024 * 1024; // 1GB
  private readonly LOG_INTERVAL = 100; // Log every 100 bars

  /**
   * Append a bar to the cache
   * - Enforces per-symbol limit
   * - Checks memory usage
   * - Sample logging
   */
  append(bar: Bar): void {
    const existing = this.cache.get(bar.symbol) || [];
    existing.push(bar);

    // Enforce per-symbol limit
    if (existing.length > this.MAX_BARS_PER_SYMBOL) {
      existing.shift(); // Remove oldest
    }

    this.cache.set(bar.symbol, existing);
    this.barCount++;

    // Check memory usage
    this.checkMemoryUsage();

    // Sample logging
    if (this.barCount % this.LOG_INTERVAL === 0) {
      const latest = this.getLatest(bar.symbol);
      console.log(
        `[${this.barCount}] ${bar.symbol} @ ${latest?.close.toFixed(2)} (${this.cache.size} symbols)`
      );
    }
  }

  /**
   * Get the latest bar for a symbol
   */
  getLatest(symbol: string): Bar | null {
    const bars = this.cache.get(symbol);
    if (!bars || bars.length === 0) return null;
    return bars[bars.length - 1] ?? null;
  }

  /**
   * Get all latest bars for all symbols
   */
  getAllLatest(): Bar[] {
    const latest: Bar[] = [];
    for (const symbol of this.cache.keys()) {
      const bar = this.getLatest(symbol);
      if (bar) latest.push(bar);
    }
    return latest;
  }

  /**
   * Get all bars for a symbol
   */
  getBars(symbol: string): Bar[] {
    return this.cache.get(symbol) || [];
  }

  /**
   * Get all symbols in cache
   */
  getSymbols(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalBars = 0;
    for (const bars of this.cache.values()) {
      totalBars += bars.length;
    }

    const estimatedBytes = totalBars * 200; // ~200 bytes per bar
    const estimatedMB = estimatedBytes / 1024 / 1024;

    return {
      symbols: this.cache.size,
      totalBars,
      estimatedMB: Math.round(estimatedMB),
      maxMemoryMB: this.MAX_MEMORY_BYTES / 1024 / 1024,
    };
  }

  /**
   * Check memory usage and alert if over limit
   */
  private checkMemoryUsage(): void {
    const stats = this.getStats();
    const estimatedBytes = stats.totalBars * 200;

    if (estimatedBytes > this.MAX_MEMORY_BYTES && !this.alertedMemory) {
      console.error(`⚠️  CACHE SIZE ALERT: ${stats.estimatedMB}MB exceeds 1GB limit!`);
      console.error(`   Symbols: ${stats.symbols}, Bars: ${stats.totalBars}`);
      this.alertedMemory = true;
    }
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.cache.clear();
    this.barCount = 0;
    this.alertedMemory = false;
  }
}

// Singleton instance
export const barCache = new BarCache();

