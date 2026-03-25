import type { Bar } from "@/types/common.types";
import { NEXT_PUBLIC_HUB_URL } from "@/config/env";

type HistoryTimeframe =
  | "1s"
  | "15s"
  | "30s"
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "1d";

interface FetchHubBarsRangeOptions {
  symbol: string;
  timeframe: HistoryTimeframe;
  start: number;
  end: number;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
  baseUrl?: string;
  cacheTtlMs?: number;
}

interface CachedHistoryEntry {
  expiresAt: number;
  promise: Promise<Bar[]>;
}

const DEFAULT_CACHE_TTL_MS = 15_000;
const historyRequestCache = new Map<string, CachedHistoryEntry>();

function createHistoryCacheKey(options: FetchHubBarsRangeOptions): string {
  return [
    options.baseUrl ?? NEXT_PUBLIC_HUB_URL,
    options.symbol,
    options.timeframe,
    options.start,
    options.end,
  ].join(":");
}

export async function fetchHubBarsRange({
  symbol,
  timeframe,
  start,
  end,
  signal,
  fetcher = fetch,
  baseUrl = NEXT_PUBLIC_HUB_URL,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
}: FetchHubBarsRangeOptions): Promise<Bar[]> {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  const key = createHistoryCacheKey({ symbol, timeframe, start, end, baseUrl });
  const now = Date.now();
  const cached = historyRequestCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const request = (async () => {
    const response = await fetcher(
      `${baseUrl}/bars/range/${symbol}?tf=${timeframe}&start=${start}&end=${end}`,
      { signal },
    );

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload?.bars) ? (payload.bars as Bar[]) : [];
  })();

  historyRequestCache.set(key, {
    expiresAt: now + cacheTtlMs,
    promise: request,
  });

  try {
    return await request;
  } catch (error) {
    historyRequestCache.delete(key);
    throw error;
  }
}

export function clearHubHistoryCacheForTesting(): void {
  historyRequestCache.clear();
}
