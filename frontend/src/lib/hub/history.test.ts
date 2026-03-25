import { describe, expect, test, vi, beforeEach } from "vitest";
import { clearHubHistoryCacheForTesting, fetchHubBarsRange } from "@/lib/hub/history";
import { makeBar } from "@/tests/factories";

describe("hub history client", () => {
  beforeEach(() => {
    clearHubHistoryCacheForTesting();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T12:00:00Z"));
  });

  test("deduplicates identical in-flight history requests", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ bars: [makeBar()] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const [first, second] = await Promise.all([
      fetchHubBarsRange({
        baseUrl: "http://localhost:3005",
        symbol: "ESH6",
        timeframe: "1m",
        start: 1,
        end: 2,
        fetcher,
      }),
      fetchHubBarsRange({
        baseUrl: "http://localhost:3005",
        symbol: "ESH6",
        timeframe: "1m",
        start: 1,
        end: 2,
        fetcher,
      }),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  test("reuses cached history responses within the ttl window", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ bars: [makeBar()] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    await fetchHubBarsRange({
      baseUrl: "http://localhost:3005",
      symbol: "ESH6",
      timeframe: "1m",
      start: 1,
      end: 2,
      fetcher,
    });

    await fetchHubBarsRange({
      baseUrl: "http://localhost:3005",
      symbol: "ESH6",
      timeframe: "1m",
      start: 1,
      end: 2,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("expires cached responses after the ttl window", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ bars: [makeBar()] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    await fetchHubBarsRange({
      baseUrl: "http://localhost:3005",
      symbol: "ESH6",
      timeframe: "1m",
      start: 1,
      end: 2,
      fetcher,
      cacheTtlMs: 1000,
    });

    vi.advanceTimersByTime(1001);

    await fetchHubBarsRange({
      baseUrl: "http://localhost:3005",
      symbol: "ESH6",
      timeframe: "1m",
      start: 1,
      end: 2,
      fetcher,
      cacheTtlMs: 1000,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
