import { describe, expect, mock, spyOn, test } from "bun:test";
import { MassiveHistoryClient } from "@/server/api/massive/history_client.js";
import { RECOVERY_TIMEFRAME } from "@/types/recovery.types.js";

describe("MassiveHistoryClient", () => {
  test("builds the aggregate request and maps results into bars", async () => {
    const fetchMock = mock(async (input: string | URL | Request) => {
      expect(String(input)).toContain(
        "/v2/aggs/ticker/ESH6/range/1/minute/1000/2000",
      );
      expect(String(input)).toContain("apiKey=test-key");

      return new Response(
        JSON.stringify({
          results: [
            {
              o: 10,
              h: 11,
              l: 9,
              c: 10.5,
              v: 100,
              n: 12,
              vw: 10.25,
              t: 1000,
            },
          ],
        }),
        { status: 200 },
      );
    });

    spyOn(globalThis, "fetch").mockImplementation(fetchMock as any);

    const client = new MassiveHistoryClient("test-key", "https://api.massive.com");
    const bars = await client.fetchBars({
      symbol: "ESH6",
      timeframe: RECOVERY_TIMEFRAME,
      startMs: 1000,
      endMs: 2000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bars).toEqual([
      {
        symbol: "ESH6",
        open: 10,
        high: 11,
        low: 9,
        close: 10.5,
        volume: 100,
        trades: 12,
        dollarVolume: 1025,
        startTime: 1000,
        endTime: 61000,
      },
    ]);
  });

  test("follows paginated next_url responses", async () => {
    const fetchMock = mock(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("cursor=next")) {
        expect(url).toContain("apiKey=test-key");
        return new Response(
          JSON.stringify({
            results: [{ o: 2, h: 3, l: 1.5, c: 2.5, v: 20, t: 2000 }],
          }),
          { status: 200 },
        );
      }

      if (url.includes("range/1/minute")) {
        return new Response(
          JSON.stringify({
            results: [{ o: 1, h: 2, l: 0.5, c: 1.5, v: 10, t: 1000 }],
            next_url: "/v2/aggs/ticker/ESH6/range/1/minute/2000/3000?cursor=next",
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected history request: ${url}`);
    });

    spyOn(globalThis, "fetch").mockImplementation(fetchMock as any);

    const client = new MassiveHistoryClient("test-key", "https://api.massive.com");
    const bars = await client.fetchBars({
      symbol: "ESH6",
      timeframe: RECOVERY_TIMEFRAME,
      startMs: 1000,
      endMs: 3000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bars.map((bar) => bar.startTime)).toEqual([1000, 2000]);
  });
});
