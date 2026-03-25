import { massiveHistoryClient } from "@/server/api/massive/history_client.js";
import { recoveryStore } from "@/server/data/recovery_store.js";
import { redisStore } from "@/server/data/redis_store.js";
import type { Bar } from "@/types/common.types.js";
import {
  RECOVERY_BUCKET_MS,
  RECOVERY_OVERLAP_MS,
  RECOVERY_RETENTION_MS,
  RECOVERY_TIMEFRAME,
  type RecoveryBackfillProvider,
  type RecoveryCheckpoint,
  type RecoveryExecutionResult,
  type RecoveryRunSource,
  type RecoveryStore,
  type RecoveryWindow,
} from "@/types/recovery.types.js";

function floorToMinute(timestamp: number): number {
  return Math.floor(timestamp / RECOVERY_BUCKET_MS) * RECOVERY_BUCKET_MS;
}

function mergeLiveBarIntoMinute(existing: Bar | undefined, liveBar: Bar): Bar {
  const minuteStart = floorToMinute(liveBar.startTime);
  const minuteEnd = minuteStart + RECOVERY_BUCKET_MS;

  if (!existing) {
    return {
      symbol: liveBar.symbol,
      open: liveBar.open,
      high: liveBar.high,
      low: liveBar.low,
      close: liveBar.close,
      volume: liveBar.volume,
      trades: liveBar.trades,
      dollarVolume: liveBar.dollarVolume,
      startTime: minuteStart,
      endTime: minuteEnd,
    };
  }

  return {
    symbol: liveBar.symbol,
    open: existing.open,
    high: Math.max(existing.high, liveBar.high),
    low: Math.min(existing.low, liveBar.low),
    close: liveBar.close,
    volume: existing.volume + liveBar.volume,
    trades: existing.trades + liveBar.trades,
    dollarVolume: (existing.dollarVolume ?? 0) + (liveBar.dollarVolume ?? 0),
    startTime: minuteStart,
    endTime: minuteEnd,
  };
}

export class RecoveryService {
  private readonly liveMinuteBars = new Map<string, Bar>();

  constructor(
    private readonly store: RecoveryStore = recoveryStore,
    private readonly redis = redisStore,
    private readonly provider: RecoveryBackfillProvider = massiveHistoryClient,
  ) {}

  async init(): Promise<void> {
    await this.store.init();
  }

  async persistLiveBar(bar: Bar): Promise<void> {
    const aggregatedBar = mergeLiveBarIntoMinute(
      this.liveMinuteBars.get(bar.symbol),
      bar,
    );
    this.liveMinuteBars.set(bar.symbol, aggregatedBar);

    await this.store.upsertBars(bar.symbol, RECOVERY_TIMEFRAME, [aggregatedBar]);
    await this.redis.setRecoveryCheckpoint({
      symbol: bar.symbol,
      timeframe: RECOVERY_TIMEFRAME,
      lastSeenBarTs: bar.startTime,
      updatedAt: Date.now(),
      source: "live",
    });
  }

  planRehydrateWindow(
    checkpoint: RecoveryCheckpoint | null,
    nowMs = Date.now(),
  ): RecoveryWindow {
    const baselineStart = Math.max(nowMs - RECOVERY_RETENTION_MS, 0);
    const checkpointStart =
      checkpoint !== null
        ? Math.max(checkpoint.lastSeenBarTs - RECOVERY_OVERLAP_MS, baselineStart)
        : baselineStart;

    return {
      startMs: checkpointStart,
      endMs: nowMs,
    };
  }

  planProviderRecoveryWindow({
    checkpoint,
    disconnectedAt,
    nowMs = Date.now(),
    endMs = nowMs,
    excludeCurrentMinute = false,
  }: {
    checkpoint: RecoveryCheckpoint | null;
    disconnectedAt?: number | null;
    nowMs?: number;
    endMs?: number;
    excludeCurrentMinute?: boolean;
  }): RecoveryWindow | null {
    const baselineStart = Math.max(nowMs - RECOVERY_RETENTION_MS, 0);
    const seedTimestamp =
      checkpoint?.lastSeenBarTs ?? disconnectedAt ?? baselineStart;
    const startMs = Math.max(seedTimestamp - RECOVERY_OVERLAP_MS, baselineStart);

    let resolvedEndMs = Math.min(endMs, nowMs);
    if (excludeCurrentMinute) {
      resolvedEndMs = Math.min(resolvedEndMs, floorToMinute(nowMs) - 1);
    }

    if (resolvedEndMs < startMs) {
      return null;
    }

    return {
      startMs,
      endMs: resolvedEndMs,
    };
  }

  async hydrateRedisFromRecoveryStore(symbols: string[]): Promise<{
    hydratedSymbols: number;
    barsLoaded: number;
  }> {
    const nowMs = Date.now();
    let hydratedSymbols = 0;
    let barsLoaded = 0;

    for (const symbol of new Set(symbols)) {
      const checkpoint = await this.redis.getRecoveryCheckpoint(
        symbol,
        RECOVERY_TIMEFRAME,
      );
      const { startMs, endMs } = this.planRehydrateWindow(checkpoint, nowMs);
      const bars = await this.store.getBars(
        symbol,
        RECOVERY_TIMEFRAME,
        startMs,
        endMs,
      );

      if (bars.length === 0) {
        continue;
      }

      await this.redis.writeBarsForRecovery(bars);
      await this.redis.setRecoveryCheckpoint({
        symbol,
        timeframe: RECOVERY_TIMEFRAME,
        lastSeenBarTs: bars[bars.length - 1]?.startTime || endMs,
        updatedAt: Date.now(),
        source: "rehydrate",
      });

      hydratedSymbols++;
      barsLoaded += bars.length;
    }

    return { hydratedSymbols, barsLoaded };
  }

  async backfillSymbolsFromProvider(
    symbols: string[],
    options: {
      source: RecoveryRunSource;
      disconnectedAt?: number | null;
      endMs?: number;
      excludeCurrentMinute?: boolean;
    },
  ): Promise<RecoveryExecutionResult[]> {
    const results: RecoveryExecutionResult[] = [];
    const nowMs = Date.now();

    for (const symbol of new Set(symbols)) {
      const checkpoint = await this.redis.getRecoveryCheckpoint(
        symbol,
        RECOVERY_TIMEFRAME,
      );
      const window = this.planProviderRecoveryWindow({
        checkpoint,
        disconnectedAt: options.disconnectedAt,
        nowMs,
        endMs: options.endMs ?? nowMs,
        excludeCurrentMinute: options.excludeCurrentMinute ?? false,
      });

      if (!window) {
        results.push({
          symbol,
          source: options.source,
          startMs: nowMs,
          endMs: nowMs,
          providerBars: 0,
          checkpointBefore: checkpoint?.lastSeenBarTs ?? null,
          checkpointAfter: checkpoint?.lastSeenBarTs ?? null,
        });
        continue;
      }

      try {
        const providerBars = await this.provider.fetchBars({
          symbol,
          timeframe: RECOVERY_TIMEFRAME,
          startMs: window.startMs,
          endMs: window.endMs,
        });

        if (providerBars.length > 0) {
          await this.store.upsertBars(symbol, RECOVERY_TIMEFRAME, providerBars);
          await this.redis.writeBarsForRecovery(providerBars);
        }

        const checkpointAfter =
          providerBars[providerBars.length - 1]?.startTime ??
          checkpoint?.lastSeenBarTs ??
          null;

        if (checkpointAfter !== null) {
          await this.redis.setRecoveryCheckpoint({
            symbol,
            timeframe: RECOVERY_TIMEFRAME,
            lastSeenBarTs: checkpointAfter,
            updatedAt: Date.now(),
            source: "backfill",
          });
        }

        results.push({
          symbol,
          source: options.source,
          startMs: window.startMs,
          endMs: window.endMs,
          providerBars: providerBars.length,
          checkpointBefore: checkpoint?.lastSeenBarTs ?? null,
          checkpointAfter,
        });
      } catch (error) {
        results.push({
          symbol,
          source: options.source,
          startMs: window.startMs,
          endMs: window.endMs,
          providerBars: 0,
          checkpointBefore: checkpoint?.lastSeenBarTs ?? null,
          checkpointAfter: checkpoint?.lastSeenBarTs ?? null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }
}

export const recoveryService = new RecoveryService();
