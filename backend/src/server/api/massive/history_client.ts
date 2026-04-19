import { MASSIVE_API_KEY, MASSIVE_API_URL } from "@/config/env.js";
import type { Bar } from "@/types/common.types.js";
import type {
  RecoveryBackfillProvider,
  RecoveryBackfillRequest,
} from "@/types/recovery.types.js";
import { RECOVERY_BUCKET_MS, RECOVERY_TIMEFRAME } from "@/types/recovery.types.js";

interface MassiveAggResult {
  c: number;
  h: number;
  l: number;
  n?: number;
  o: number;
  t: number;
  v: number;
  vw?: number;
}

interface MassiveAggResponse {
  status?: string;
  results?: MassiveAggResult[];
  next_url?: string;
}

function buildBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function appendApiKey(url: string, apiKey: string, baseUrl: string): string {
  const resolved = new URL(url, `${buildBaseUrl(baseUrl)}/`);
  if (!resolved.searchParams.has("apiKey")) {
    resolved.searchParams.set("apiKey", apiKey);
  }
  return resolved.toString();
}

function mapAggregateToBar(symbol: string, result: MassiveAggResult): Bar {
  return {
    symbol,
    open: result.o,
    high: result.h,
    low: result.l,
    close: result.c,
    volume: result.v,
    trades: result.n ?? 0,
    dollarVolume: result.vw ? result.vw * result.v : undefined,
    startTime: result.t,
    endTime: result.t + RECOVERY_BUCKET_MS,
  };
}

export class MassiveHistoryClient implements RecoveryBackfillProvider {
  constructor(
    private readonly apiKey: string = MASSIVE_API_KEY,
    private readonly baseUrl: string = MASSIVE_API_URL,
  ) {}

  async fetchBars(request: RecoveryBackfillRequest): Promise<Bar[]> {
    if (request.timeframe !== RECOVERY_TIMEFRAME) {
      throw new Error(
        `Unsupported recovery timeframe: ${request.timeframe}. Only ${RECOVERY_TIMEFRAME} is supported.`,
      );
    }

    if (request.endMs < request.startMs) {
      return [];
    }

    const bars: Bar[] = [];
    let nextUrl: string | null = `${buildBaseUrl(this.baseUrl)}/v2/aggs/ticker/${request.symbol}/range/1/minute/${request.startMs}/${request.endMs}?sort=asc&limit=50000&apiKey=${this.apiKey}`;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Historical aggregate request failed for ${request.symbol}: ${response.status} ${response.statusText}`,
        );
      }

      const payload = (await response.json()) as MassiveAggResponse;
      const results = Array.isArray(payload.results) ? payload.results : [];
      for (const result of results) {
        bars.push(mapAggregateToBar(request.symbol, result));
      }

      nextUrl = payload.next_url
        ? appendApiKey(payload.next_url, this.apiKey, this.baseUrl)
        : null;
    }

    return bars;
  }
}

export const massiveHistoryClient = new MassiveHistoryClient();
