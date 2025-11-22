/*
import pg from 'pg';
import { Bar } from '@/types/common.types.js';

// TimescaleDB Store (Inactive)
// This is a placeholder for future implementation.
// It is currently commented out to prevent connection errors.

const { Pool } = pg;

// TODO: Add these to .env
const TIMESCALE_CONFIG = {
  user: process.env.TIMESCALE_USER || 'postgres',
  host: process.env.TIMESCALE_HOST || 'localhost',
  database: process.env.TIMESCALE_DB || 'market_data',
  password: process.env.TIMESCALE_PASSWORD || 'password',
  port: parseInt(process.env.TIMESCALE_PORT || '5432'),
};

class TimescaleStore {
  private pool: pg.Pool;

  constructor() {
    this.pool = new Pool(TIMESCALE_CONFIG);
    
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async init() {
    // Create table and hypertable if not exists
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS bars (
          time TIMESTAMPTZ NOT NULL,
          symbol TEXT NOT NULL,
          open DOUBLE PRECISION NULL,
          high DOUBLE PRECISION NULL,
          low DOUBLE PRECISION NULL,
          close DOUBLE PRECISION NULL,
          volume DOUBLE PRECISION NULL,
          trades INTEGER NULL,
          dollar_volume DOUBLE PRECISION NULL
        );
      `);

      // Convert to hypertable (if not already)
      // Note: This might fail if already a hypertable, handle gracefully in real impl
      try {
        await client.query(`SELECT create_hypertable('bars', 'time', if_not_exists => TRUE);`);
      } catch (e) {
        // Ignore if already exists
      }
      
      // Create index on symbol
      await client.query(`CREATE INDEX IF NOT EXISTS idx_bars_symbol ON bars (symbol, time DESC);`);
      
    } finally {
      client.release();
    }
  }

  async writeBar(bar: Bar) {
    const query = `
      INSERT INTO bars (time, symbol, open, high, low, close, volume, trades, dollar_volume)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    const values = [
      new Date(bar.endTime), // Use endTime as the bar time
      bar.symbol,
      bar.open,
      bar.high,
      bar.low,
      bar.close,
      bar.volume,
      bar.trades,
      bar.dollarVolume || 0
    ];

    try {
      await this.pool.query(query, values);
    } catch (err) {
      console.error('Error writing to TimescaleDB:', err);
    }
  }
}

export const timescaleStore = new TimescaleStore();
*/

export const timescaleStore = {
  writeBar: async (bar: any) => {
    // No-op
  },
  init: async () => {
    // No-op
  },
};
