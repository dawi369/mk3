export const LIMITS = {
  // Bar storage limits
  maxHubBars: 86_400, // legacy, Max bars to keep in Redis List per symbol, used for testing with the rest api
  maxFlowHistoryBars: 100, // legacy, Max bars in Hub's in-memory rolling history

  // Redis operation limits
  redisScanBatchSize: 100, // Batch size for SCAN operations
  redisDeleteBatchSize: 100, // Batch size for DEL operations
  maxStreamLength: 10_000_000, // Max bars in Stream (100 tickers * 24h = 8.6m)
};
