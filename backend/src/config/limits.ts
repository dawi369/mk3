export const LIMITS = {
  // Bar storage
  maxHubBars: 86_400, // Max bars per symbol in Redis LIST (1 day at 1-second bars)

  // Redis operation batching
  redisScanBatchSize: 100,
  redisDeleteBatchSize: 100,

  // Stream cap (~100 tickers × 24h of 1-min bars = 144k, set 10M for headroom)
  maxStreamLength: 10_000_000,
};
