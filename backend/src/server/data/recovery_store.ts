import { Database } from "bun:sqlite";
import { mkdir, readFile, readdir } from "fs/promises";
import { dirname, extname, join } from "path";
import { fileURLToPath } from "url";
import type { Bar } from "@/types/common.types.js";
import type {
  RecoveryStore,
  RecoveryStoreStats,
  RecoveryTimeframe,
} from "@/types/recovery.types.js";
import { RECOVERY_RETENTION_MS } from "@/types/recovery.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RECOVERY_ROOT = join(__dirname, "../../../runtime/recovery");
const RECOVERY_DB_PATH = join(RECOVERY_ROOT, "recovery.sqlite");

function trimToRetention(bars: Bar[]): Bar[] {
  const cutoff = Date.now() - RECOVERY_RETENTION_MS;
  return bars.filter((bar) => bar.startTime >= cutoff);
}

function normalizeBars(bars: Bar[]): Bar[] {
  const uniqueByStart = new Map<number, Bar>();

  for (const bar of trimToRetention(bars)) {
    uniqueByStart.set(bar.startTime, bar);
  }

  return Array.from(uniqueByStart.values()).sort(
    (left, right) => left.startTime - right.startTime,
  );
}

async function readLegacyBarsFromFile(filepath: string): Promise<Bar[]> {
  try {
    const raw = await readFile(filepath, "utf8");
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const bars: Bar[] = [];
    for (const line of lines) {
      try {
        bars.push(JSON.parse(line) as Bar);
      } catch {
        // Skip malformed lines; legacy files should not block migration.
      }
    }

    return normalizeBars(bars);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

class SqliteRecoveryStore implements RecoveryStore {
  private db: Database | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    await mkdir(RECOVERY_ROOT, { recursive: true });
    this.db = new Database(RECOVERY_DB_PATH, { create: true });

    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    this.db.exec("PRAGMA temp_store = MEMORY;");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recovery_bars (
        symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        volume REAL NOT NULL,
        trades INTEGER NOT NULL,
        dollar_volume REAL,
        PRIMARY KEY (symbol, timeframe, start_time)
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_recovery_bars_lookup
      ON recovery_bars (symbol, timeframe, start_time);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recovery_legacy_imports (
        path TEXT PRIMARY KEY,
        imported_at INTEGER NOT NULL
      );
    `);

    this.pruneExpiredBars();
    this.initialized = true;
    await this.importLegacyFiles();
  }

  async upsertBars(
    symbol: string,
    timeframe: RecoveryTimeframe,
    bars: Bar[],
  ): Promise<void> {
    if (bars.length === 0) return;

    await this.init();
    const db = this.getDb();
    const cutoff = Date.now() - RECOVERY_RETENTION_MS;
    const normalized = normalizeBars(bars);

    db.exec("BEGIN IMMEDIATE;");
    try {
      const insert = db.query(
        `
          INSERT INTO recovery_bars (
            symbol,
            timeframe,
            start_time,
            end_time,
            open,
            high,
            low,
            close,
            volume,
            trades,
            dollar_volume
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(symbol, timeframe, start_time) DO UPDATE SET
            end_time = excluded.end_time,
            open = excluded.open,
            high = excluded.high,
            low = excluded.low,
            close = excluded.close,
            volume = excluded.volume,
            trades = excluded.trades,
            dollar_volume = excluded.dollar_volume
        `,
      );

      for (const bar of normalized) {
        if (bar.startTime < cutoff) continue;
        insert.run(
          symbol,
          timeframe,
          bar.startTime,
          bar.endTime,
          bar.open,
          bar.high,
          bar.low,
          bar.close,
          bar.volume,
          bar.trades,
          bar.dollarVolume ?? null,
        );
      }

      this.deleteExpiredBarsFor(symbol, timeframe, cutoff);
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }
  }

  async getBars(
    symbol: string,
    timeframe: RecoveryTimeframe,
    startMs: number,
    endMs: number,
  ): Promise<Bar[]> {
    await this.init();
    const db = this.getDb();
    const cutoff = Date.now() - RECOVERY_RETENTION_MS;
    const rows = db
      .query(
        `
          SELECT
            symbol,
            open,
            high,
            low,
            close,
            volume,
            trades,
            dollar_volume AS dollarVolume,
            start_time AS startTime,
            end_time AS endTime
          FROM recovery_bars
          WHERE symbol = ?
            AND timeframe = ?
            AND start_time >= ?
            AND start_time <= ?
          ORDER BY start_time ASC
        `,
      )
      .all(symbol, timeframe, Math.max(startMs, cutoff), endMs) as Bar[];

    return rows;
  }

  async getLatestTimestamp(
    symbol: string,
    timeframe: RecoveryTimeframe,
  ): Promise<number | null> {
    await this.init();
    const db = this.getDb();
    const cutoff = Date.now() - RECOVERY_RETENTION_MS;
    const row = db
      .query(
        `
          SELECT MAX(start_time) AS latestTs
          FROM recovery_bars
          WHERE symbol = ?
            AND timeframe = ?
            AND start_time >= ?
        `,
      )
      .get(symbol, timeframe, cutoff) as { latestTs: number | null } | null;

    return row?.latestTs ?? null;
  }

  async getStats(
    symbol: string,
    timeframe: RecoveryTimeframe,
  ): Promise<RecoveryStoreStats> {
    await this.init();
    const db = this.getDb();
    const cutoff = Date.now() - RECOVERY_RETENTION_MS;
    const row = db
      .query(
        `
          SELECT
            COUNT(*) AS barCount,
            MIN(start_time) AS oldestBarTs,
            MAX(start_time) AS newestBarTs
          FROM recovery_bars
          WHERE symbol = ?
            AND timeframe = ?
            AND start_time >= ?
        `,
      )
      .get(symbol, timeframe, cutoff) as
      | { barCount: number; oldestBarTs: number | null; newestBarTs: number | null }
      | null;

    return {
      symbol,
      timeframe,
      barCount: row?.barCount ?? 0,
      oldestBarTs: row?.oldestBarTs ?? null,
      newestBarTs: row?.newestBarTs ?? null,
    };
  }

  private getDb(): Database {
    if (!this.db) {
      throw new Error("Recovery database not initialized");
    }

    return this.db;
  }

  private pruneExpiredBars(): void {
    const cutoff = Date.now() - RECOVERY_RETENTION_MS;
    this.getDb()
      .query("DELETE FROM recovery_bars WHERE start_time < ?")
      .run(cutoff);
  }

  private deleteExpiredBarsFor(
    symbol: string,
    timeframe: RecoveryTimeframe,
    cutoff: number,
  ): void {
    this.getDb()
      .query(
        `
          DELETE FROM recovery_bars
          WHERE symbol = ?
            AND timeframe = ?
            AND start_time < ?
        `,
      )
      .run(symbol, timeframe, cutoff);
  }

  private async importLegacyFiles(): Promise<void> {
    const db = this.getDb();
    const entries = await readdir(RECOVERY_ROOT, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const timeframe = entry.name as RecoveryTimeframe;
      const timeframeDir = join(RECOVERY_ROOT, entry.name);
      const files = await readdir(timeframeDir, { withFileTypes: true });

      for (const file of files) {
        if (!file.isFile() || extname(file.name) !== ".jsonl") continue;

        const filepath = join(timeframeDir, file.name);
        const alreadyImported = db
          .query(
            "SELECT 1 AS imported FROM recovery_legacy_imports WHERE path = ? LIMIT 1",
          )
          .get(filepath) as { imported: number } | null;

        if (alreadyImported) continue;

        const symbol = file.name.slice(0, -".jsonl".length);
        const bars = await readLegacyBarsFromFile(filepath);
        if (bars.length > 0) {
          await this.upsertBars(symbol, timeframe, bars);
        }

        db.query(
          `
            INSERT INTO recovery_legacy_imports (path, imported_at)
            VALUES (?, ?)
            ON CONFLICT(path) DO UPDATE SET imported_at = excluded.imported_at
          `,
        ).run(filepath, Date.now());
      }
    }
  }
}

export const recoveryStore = new SqliteRecoveryStore();
