import pg from "pg";
import { promisify } from "util";
import { gzip, unzip } from "zlib";
import { redisStore } from "@/server/data/redis_store.js";
import type { Bar } from "@/types/common.types.js";

const gzipAsync = promisify(gzip);
const unzipAsync = promisify(unzip);

const { Pool } = pg;

class TimescaleStore {
  private pool: pg.Pool | null = null;
  private isConnected = false;

  constructor() {}

  async init() {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping TimescaleDB init");
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20, // Max clients in pool
        idleTimeoutMillis: 30000,
      });

      // Test connection
      const client = await this.pool.connect();
      console.log("Connected to TimescaleDB");

      // Initialize Schema
      await client.query(`
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
      `);

      // Convert to hypertable (if not already)
      // We use a DO block to avoid errors if it's already a hypertable
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = 'bars') THEN
            PERFORM create_hypertable('bars', 'timestamp');
          END IF;
        END
        $$;
      `);

      // Create index on symbol for faster queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_bars_symbol_time ON bars (symbol, timestamp DESC);
      `);

      client.release();
      this.isConnected = true;
      console.log("TimescaleDB schema initialized");
    } catch (err) {
      console.error("Failed to initialize TimescaleDB:", err);
      // Don't crash, just stay inactive
    }
  }

  async insertBar(bar: Bar) {
    if (!this.isConnected || !this.pool) return;

    const query = `
      INSERT INTO bars (symbol, open, high, low, close, volume, vwap, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8 / 1000.0))
      ON CONFLICT (symbol, timestamp) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        vwap = EXCLUDED.vwap;
    `;

    const vwap =
      bar.dollarVolume && bar.volume
        ? bar.dollarVolume / bar.volume
        : bar.close;

    const values = [
      bar.symbol,
      bar.open,
      bar.high,
      bar.low,
      bar.close,
      bar.volume,
      vwap,
      bar.startTime,
    ];

    try {
      await this.pool.query(query, values);
    } catch (err) {
      console.error(`Failed to insert bar for ${bar.symbol}:`, err);
    }
  }

  /**
   * Batch insert bars for efficient bulk loading
   */
  async insertBatch(bars: Bar[]) {
    if (!this.isConnected || !this.pool || bars.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
        INSERT INTO bars (symbol, open, high, low, close, volume, vwap, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8 / 1000.0))
        ON CONFLICT (symbol, timestamp) DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume,
          vwap = EXCLUDED.vwap;
      `;

      for (const bar of bars) {
        const vwap =
          bar.dollarVolume && bar.volume
            ? bar.dollarVolume / bar.volume
            : bar.close;
        const values = [
          bar.symbol,
          bar.open,
          bar.high,
          bar.low,
          bar.close,
          bar.volume,
          vwap,
          bar.startTime,
        ];
        await client.query(query, values);
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Batch insert failed (${bars.length} bars):`, err);
      throw err;
    } finally {
      client.release();
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
    endMs: number
  ): Promise<Bar[]> {
    if (!this.isConnected || !this.pool) return [];

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
        const monthStart = new Date(Date.UTC(iterYear, iterMonth, 1)).getTime();
        const monthEnd = new Date(
          Date.UTC(iterYear, iterMonth + 1, 0, 23, 59, 59, 999)
        ).getTime();

        const query = `
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
          WHERE symbol = $1 
          AND timestamp >= to_timestamp($2 / 1000.0)
          AND timestamp <= to_timestamp($3 / 1000.0)
          ORDER BY timestamp ASC;
        `;

        try {
          const result = await this.pool.query(query, [
            symbol,
            monthStart,
            monthEnd,
          ]);
          monthBars = result.rows.map((row) => {
            const startTime = Number(row.timestamp);
            return {
              symbol: row.symbol,
              open: row.open,
              high: row.high,
              low: row.low,
              close: row.close,
              volume: row.volume,
              trades: 0, // Not stored in DB currently
              dollarVolume: row.volume * row.vwap,
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
            err
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
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export const timescaleStore = new TimescaleStore();
