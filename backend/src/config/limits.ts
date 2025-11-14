// src/config/limits.ts
export const LIMITS = {
  // maxClients: 200,             // hard cap for concurrent client sockets
  // maxSubscriptionsPerClient: 50,
  // maxSymbolsGlobal: 2000,      // protects upstream sub list size
  // heartbeatMs: 15_000,
  // reconnectBackoffMs: { base: 500, max: 20_000 },

  // Bar storage limits
  maxEdgeBars: 10_000, // Max bars to keep in Edge cache per symbol
  maxHubBars: 10_000, // Max bars to keep in Redis per symbol (today)
  maxFlowHistoryBars: 100, // Max bars in Hub's in-memory rolling history

  // Redis operation limits
  redisScanBatchSize: 100, // Batch size for SCAN operations
  redisDeleteBatchSize: 100, // Batch size for DEL operations

  // WebSocket server limits
  maxWsClients: 10_000, // Max concurrent WS connections (total)
  maxRealTimeClients: 2_500, // Max real-time clients (bandwidth limited)
  maxMessagesPerSecond: 1_000, // Rate limit per client
  wsHeartbeatIntervalMs: 30_000, // Send ping every 30s
  wsHeartbeatTimeoutMs: 10_000, // Expect pong within 10s

  // Delayed streaming configuration
  delayPollIntervalMs: 100, // Poll delayed bars every 100ms
  maxDelaySeconds: 3_600, // Max 1 hour delay
  delayedBarRetentionMs: 1_200_000, // Keep 20 min of bars for delayed clients
  delayedBarBatchSize: 100, // Max bars to send per poll cycle per client
  delayedStreamWindowMs: 200, // Window size for gathering bars to send (ms)
};
