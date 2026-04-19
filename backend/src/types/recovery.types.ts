import type { Bar } from "@/types/common.types.js";

export const RECOVERY_TIMEFRAME = "1m";
export const RECOVERY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const RECOVERY_OVERLAP_MS = 5 * 60 * 1000;
export const RECOVERY_BUCKET_MS = 60 * 1000;

export type RecoveryTimeframe = typeof RECOVERY_TIMEFRAME;
export type RecoveryCheckpointSource = "live" | "rehydrate" | "backfill";
export type RecoveryRunSource = "startup" | "reconnect" | "manual";

export interface RecoveryCheckpoint {
  symbol: string;
  timeframe: RecoveryTimeframe;
  lastSeenBarTs: number;
  updatedAt: number;
  source: RecoveryCheckpointSource;
}

export interface RecoveryStoreStats {
  symbol: string;
  timeframe: RecoveryTimeframe;
  barCount: number;
  oldestBarTs: number | null;
  newestBarTs: number | null;
}

export interface RecoveryWindow {
  startMs: number;
  endMs: number;
}

export interface RecoveryBackfillRequest {
  symbol: string;
  timeframe: RecoveryTimeframe;
  startMs: number;
  endMs: number;
}

export interface RecoveryBackfillProvider {
  fetchBars(request: RecoveryBackfillRequest): Promise<Bar[]>;
}

export interface RecoveryExecutionResult {
  symbol: string;
  source: RecoveryRunSource;
  startMs: number;
  endMs: number;
  providerBars: number;
  checkpointBefore: number | null;
  checkpointAfter: number | null;
  error?: string;
}

export interface RecoveryStore {
  init(): Promise<void>;
  upsertBars(symbol: string, timeframe: RecoveryTimeframe, bars: Bar[]): Promise<void>;
  getBars(
    symbol: string,
    timeframe: RecoveryTimeframe,
    startMs: number,
    endMs: number,
  ): Promise<Bar[]>;
  getLatestTimestamp(
    symbol: string,
    timeframe: RecoveryTimeframe,
  ): Promise<number | null>;
  getStats(symbol: string, timeframe: RecoveryTimeframe): Promise<RecoveryStoreStats>;
}
