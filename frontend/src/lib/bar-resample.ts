import type { Bar } from "@/types/common.types";
import type { Timeframe } from "@/types/ticker.types";

const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "1s": 1,
  "5s": 5,
  "30s": 30,
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

export function resampleBars(bars: Bar[], timeframe: Timeframe): Bar[] {
  if (!bars || bars.length === 0) return [];

  const intervalMs = TIMEFRAME_SECONDS[timeframe] * 1000;
  const sorted = [...bars].sort((a, b) => a.startTime - b.startTime);
  const result: Bar[] = [];

  let bucketStart = Math.floor(sorted[0].startTime / intervalMs) * intervalMs;
  let bucketEnd = bucketStart + intervalMs;
  let open = sorted[0].open;
  let high = sorted[0].high;
  let low = sorted[0].low;
  let close = sorted[0].close;
  let volume = 0;
  let trades = 0;
  let symbol = sorted[0].symbol;

  for (const bar of sorted) {
    const barBucket = Math.floor(bar.startTime / intervalMs) * intervalMs;
    if (barBucket !== bucketStart) {
      result.push({
        symbol,
        open,
        high,
        low,
        close,
        volume,
        trades,
        startTime: bucketStart,
        endTime: bucketEnd,
      });

      bucketStart = barBucket;
      bucketEnd = bucketStart + intervalMs;
      open = bar.open;
      high = bar.high;
      low = bar.low;
      close = bar.close;
      volume = bar.volume || 0;
      trades = bar.trades || 0;
      symbol = bar.symbol;
      continue;
    }

    high = Math.max(high, bar.high);
    low = Math.min(low, bar.low);
    close = bar.close;
    volume += bar.volume || 0;
    trades += bar.trades || 0;
  }

  result.push({
    symbol,
    open,
    high,
    low,
    close,
    volume,
    trades,
    startTime: bucketStart,
    endTime: bucketEnd,
  });

  return result;
}
