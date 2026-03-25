import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
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

function getFilePath(symbol: string, timeframe: RecoveryTimeframe): string {
  return join(RECOVERY_ROOT, timeframe, `${symbol}.jsonl`);
}

function normalizeBars(bars: Bar[]): Bar[] {
  const uniqueByStart = new Map<number, Bar>();

  for (const bar of bars) {
    uniqueByStart.set(bar.startTime, bar);
  }

  return Array.from(uniqueByStart.values()).sort(
    (left, right) => left.startTime - right.startTime,
  );
}

function trimToRetention(bars: Bar[]): Bar[] {
  const cutoff = Date.now() - RECOVERY_RETENTION_MS;
  return bars.filter((bar) => bar.startTime >= cutoff);
}

async function readBarsFromFile(filepath: string): Promise<Bar[]> {
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
        // Skip malformed lines; this store is append-derived and should be self-healing.
      }
    }

    return normalizeBars(trimToRetention(bars));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeBarsToFile(filepath: string, bars: Bar[]): Promise<void> {
  const dir = dirname(filepath);
  await mkdir(dir, { recursive: true });

  const payload =
    bars.map((bar) => JSON.stringify(bar)).join("\n") +
    (bars.length > 0 ? "\n" : "");
  await writeFile(filepath, payload, "utf8");
}

class FileRecoveryStore implements RecoveryStore {
  async init(): Promise<void> {
    await mkdir(RECOVERY_ROOT, { recursive: true });
  }

  async upsertBars(
    symbol: string,
    timeframe: RecoveryTimeframe,
    bars: Bar[],
  ): Promise<void> {
    if (bars.length === 0) return;

    const filepath = getFilePath(symbol, timeframe);
    const existing = await readBarsFromFile(filepath);
    const merged = normalizeBars(trimToRetention([...existing, ...bars]));
    await writeBarsToFile(filepath, merged);
  }

  async getBars(
    symbol: string,
    timeframe: RecoveryTimeframe,
    startMs: number,
    endMs: number,
  ): Promise<Bar[]> {
    const filepath = getFilePath(symbol, timeframe);
    const bars = await readBarsFromFile(filepath);
    return bars.filter(
      (bar) => bar.startTime >= startMs && bar.startTime <= endMs,
    );
  }

  async getLatestTimestamp(
    symbol: string,
    timeframe: RecoveryTimeframe,
  ): Promise<number | null> {
    const filepath = getFilePath(symbol, timeframe);
    const bars = await readBarsFromFile(filepath);
    return bars.length > 0 ? bars[bars.length - 1]?.startTime || null : null;
  }

  async getStats(
    symbol: string,
    timeframe: RecoveryTimeframe,
  ): Promise<RecoveryStoreStats> {
    const filepath = getFilePath(symbol, timeframe);
    const bars = await readBarsFromFile(filepath);

    return {
      symbol,
      timeframe,
      barCount: bars.length,
      oldestBarTs: bars[0]?.startTime || null,
      newestBarTs: bars[bars.length - 1]?.startTime || null,
    };
  }
}

export const recoveryStore = new FileRecoveryStore();
