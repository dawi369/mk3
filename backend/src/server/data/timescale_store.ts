import postgres from "postgres";
import { promisify } from "util";
import { gzip, unzip } from "zlib";
import { redisStore } from "@/server/data/redis_store.js";
import type { Bar } from "@/types/common.types.js";
import { DATABASE_URL } from "@/config/env.js";

const gzipAsync = promisify(gzip);
const unzipAsync = promisify(unzip);

class TimescaleStore {
  private sql: postgres.Sql | null = null;
  private connected = false;

  constructor() {}

  get isConnected(): boolean {
    return this.connected;
  }

  /**
   * Ping the database to verify connection is alive
   */
  async ping(): Promise<boolean> {
    if (!this.sql || !this.connected) return false;
    try {
      await this.sql`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async init() {
    if (!DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping TimescaleDB init");
      return;
    }

    try {
      this.sql = postgres(DATABASE_URL, {
        max: 20, // Max connections
        idle_timeout: 30, // Idle timeout in seconds
      });

      // Suppress NOTICE messages (like "relation already exists") at session level
      await this.sql`SET client_min_messages TO WARNING`;

      // Test connection
      await this.sql`SELECT 1`;
      console.log("Connected to TimescaleDB");

      // Initialize Schema
      await this.sql`
        CREATE TABLE IF NOT EXISTS bars (
          symbol TEXT NOT NULL,
          open DOUBLE PRECISION NOT NULL,
          high DOUBLE PRECISION NOT NULL,
          low DOUBLE PRECISION NOT NULL,
          close DOUBLE PRECISION NOT NULL,
          volume DOUBLE PRECISION NOT NULL,
          vwap DOUBLE PRECISION NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          UNIQUE (symbol, timestamp)
        );
      `;

      // Convert to hypertable (if not already)
      // We use a DO block to avoid errors if it's already a hypertable
      await this.sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = 'bars') THEN
            PERFORM create_hypertable('bars', 'timestamp');
          END IF;
        END
        $$;
      `;

      // Create index on symbol for faster queries
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_bars_symbol_time ON bars (symbol, timestamp DESC);
      `;

      this.connected = true;
      console.log("TimescaleDB schema initialized");
    } catch (err: any) {
      console.error("Failed to initialize TimescaleDB:", err);
      if (err.code === "ECONNREFUSED") {
        console.error(
          "❌ TimescaleDB connection refused. Is the 'timescaledb' container running? (docker compose up -d timescaledb)",
        );
      }
      console.error("Fatal: TimescaleDB connection failed. Exiting...");
      process.exit(1);
    }
  }

  async insertBar(bar: Bar) {
    if (!this.isConnected || !this.sql) return;

    const vwap =
      bar.dollarVolume && bar.volume
        ? bar.dollarVolume / bar.volume
        : bar.close;
    const timestamp = new Date(bar.startTime);

    try {
      await this.sql`
        INSERT INTO bars (symbol, open, high, low, close, volume, vwap, timestamp)
        VALUES (${bar.symbol}, ${bar.open}, ${bar.high}, ${bar.low}, ${bar.close}, ${bar.volume}, ${vwap}, ${timestamp})
        ON CONFLICT (symbol, timestamp) DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume,
          vwap = EXCLUDED.vwap;
      `;
    } catch (err) {
      console.error(`Failed to insert bar for ${bar.symbol}:`, err);
    }
  }

  /**
   * Batch insert bars for efficient bulk loading
   */
  async insertBatch(bars: Bar[]) {
    if (!this.isConnected || !this.sql || bars.length === 0) return;

    try {
      const data = bars.map((bar) => ({
        symbol: bar.symbol,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        vwap:
          bar.dollarVolume && bar.volume
            ? bar.dollarVolume / bar.volume
            : bar.close,
        timestamp: new Date(bar.startTime),
      }));

      await this.sql`
        INSERT INTO bars ${this.sql(data)}
        ON CONFLICT (symbol, timestamp) DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume,
          vwap = EXCLUDED.vwap;
      `;
    } catch (err) {
      console.error(`Batch insert failed (${bars.length} bars):`, err);
      throw err;
    }
  }

  /**
   * Get history with Read-Through Caching
   * 1. Split request into monthly chunks
   * 2. For past months: Check Redis -> If miss, Query DB & Cache
   * 3. For current month: Query DB directly (no long-term cache)
   * 4. Combine and filter
   */
  async getHistory(
    symbol: string,
    startMs: number,
    endMs: number,
  ): Promise<Bar[]> {
    if (!this.isConnected || !this.sql) return [];

    const startDate = new Date(startMs);
    const endDate = new Date(endMs);
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    const chunks: Bar[] = [];

    // Iterate month by month
    let iterYear = startDate.getUTCFullYear();
    let iterMonth = startDate.getUTCMonth();

    while (
      iterYear < endDate.getUTCFullYear() ||
      (iterYear === endDate.getUTCFullYear() &&
        iterMonth <= endDate.getUTCMonth())
    ) {
      const isCurrentMonth =
        iterYear === currentYear && iterMonth === currentMonth;
      const monthKey = `history:${symbol}:${iterYear}-${(iterMonth + 1)
        .toString()
        .padStart(2, "0")}`;

      let monthBars: Bar[] = [];

      if (!isCurrentMonth) {
        // Try Redis first for past months
        try {
          const cached = await redisStore.redis.get(monthKey);
          if (cached) {
            // Decompress
            const buffer = Buffer.from(cached, "base64");
            const unzipped = await unzipAsync(buffer);
            monthBars = JSON.parse(unzipped.toString());
          }
        } catch (err) {
          console.error(`Cache read failed for ${monthKey}:`, err);
        }
      }

      // If not in cache (or is current month), query DB
      if (monthBars.length === 0) {
        // Calculate month start/end
        const monthStart = new Date(Date.UTC(iterYear, iterMonth, 1));
        const monthEnd = new Date(
          Date.UTC(iterYear, iterMonth + 1, 0, 23, 59, 59, 999),
        );

        try {
          const result = await this.sql`
            SELECT 
              symbol,
              open,
              high,
              low,
              close,
              volume,
              vwap,
              extract(epoch from timestamp) * 1000 as timestamp
            FROM bars
            WHERE symbol = ${symbol} 
            AND timestamp >= ${monthStart}
            AND timestamp <= ${monthEnd}
            ORDER BY timestamp ASC;
          `;

          monthBars = result.map((row) => {
            const startTime = Number(row.timestamp);
            return {
              symbol: row.symbol as string,
              open: row.open as number,
              high: row.high as number,
              low: row.low as number,
              close: row.close as number,
              volume: row.volume as number,
              trades: 0, // Not stored in DB currently
              dollarVolume: (row.volume as number) * (row.vwap as number),
              startTime: startTime,
              endTime: startTime + 60000, // Assume 1-minute bars
            };
          });

          // Cache if it's a past month and we found data
          if (!isCurrentMonth && monthBars.length > 0) {
            const jsonStr = JSON.stringify(monthBars);
            const zipped = await gzipAsync(jsonStr);
            // Store as base64 string
            await redisStore.redis.set(monthKey, zipped.toString("base64"));
            // No expiry for history (or set very long, e.g. 1 year)
            // await redisStore.redis.expire(monthKey, 60 * 60 * 24 * 365);
          }
        } catch (err) {
          console.error(
            `DB query failed for ${symbol} ${iterYear}-${iterMonth}:`,
            err,
          );
        }
      }

      chunks.push(...monthBars);

      // Next month
      iterMonth++;
      if (iterMonth > 11) {
        iterMonth = 0;
        iterYear++;
      }
    }

    // Filter exact range
    return chunks.filter((b) => b.startTime >= startMs && b.startTime <= endMs);
  }

  async close() {
    if (this.sql) {
      await this.sql.end();
    }
  }
}

export const timescaleStore = new TimescaleStore();
