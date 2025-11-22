import cron from "node-cron";
import { timescaleStore } from "@/servers/hub/data/timescale_store.js";
import { POLYGON_API_KEY } from "@/config/env.js";
import type { Bar } from "@/types/common.types.js";
import { POLYGON_API_URL } from "@/config/env.js";
import {
  futuresUSIndicesMinutesRequest,
  futuresMetalsMinutesRequest,
} from "@/utils/consts.js";

/**
 * Fetch aggregates for a specific date
 */
async function fetchAggregates(
  symbol: string,
  dateStr: string
): Promise<Bar[]> {
  const url = `${POLYGON_API_URL}/v2/aggs/ticker/${symbol}/range/1/minute/${dateStr}/${dateStr}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `Failed to fetch history for ${symbol} on ${dateStr}: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = (await response.json()) as any;
    if (data.status !== "OK" || !data.results) {
      return [];
    }

    return data.results.map((r: any) => ({
      symbol: symbol,
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
      trades: r.n,
      dollarVolume: r.vw * r.v,
      startTime: r.t,
      endTime: r.t + 60000,
    }));
  } catch (err) {
    console.error(`Error fetching history for ${symbol}:`, err);
    return [];
  }
}

/**
 * Daily Job: Sync Yesterday's Data
 * Runs at 1:00 AM ET every day
 */
export class HistorySyncJob {
  constructor() {}

  schedule() {
    // // Run at 1:00 AM America/New_York
    // cron.schedule(
    //   "0 1 * * *",
    //   async () => {
    //     await this.run();
    //   },
    //   {
    //     timezone: "America/New_York",
    //   }
    // );
    // console.log("📅 HistorySyncJob scheduled (Daily at 1:00 AM ET)");
    console.log("📅 Updates at 11am next day, run once a month on a weekend");
  }

  async run() {
    console.log("🔄 Starting Daily History Sync...");

    // 1. Determine "Yesterday" in ET
    const now = new Date();
    const etNow = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    etNow.setDate(etNow.getDate() - 1);
    const dateStr = etNow.toISOString().split("T")[0] || ""; // YYYY-MM-DD

    console.log(`Target Date: ${dateStr}`);

    const symbols = [
      ...futuresUSIndicesMinutesRequest.symbols,
      ...futuresMetalsMinutesRequest.symbols,
    ];
    console.log(`Syncing ${symbols.length} symbols...`);

    // 3. Iterate and Sync
    for (const symbol of symbols) {
      // Rate limit protection (Polygon: 5 req/min for free, but we assume paid/higher limits)
      // Adding a small delay just in case
      await new Promise((r) => setTimeout(r, 200));

      const bars = await fetchAggregates(symbol, dateStr);
      if (bars.length > 0) {
        await timescaleStore.insertBatch(bars);
        console.log(`✅ Synced ${symbol}: ${bars.length} bars`);
      } else {
        console.log(`⚠️  No data for ${symbol}`);
      }
    }

    console.log("✅ Daily History Sync Complete");
  }
}

export const historySyncJob = new HistorySyncJob();
