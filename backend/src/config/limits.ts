// src/config/limits.ts
export const LIMITS = {
    // maxClients: 200,             // hard cap for concurrent client sockets
    // maxSubscriptionsPerClient: 50,
    // maxSymbolsGlobal: 2000,      // protects upstream sub list size
    // heartbeatMs: 15_000,
    // reconnectBackoffMs: { base: 500, max: 20_000 },
    maxEdgeBars: 10_000,
    
    // WebSocket server limits
    maxWsClients: 1000,                    // Max concurrent WS connections
    maxMessagesPerSecond: 1000,            // Rate limit per client
    wsHeartbeatIntervalMs: 30_000,         // Send ping every 30s
    wsHeartbeatTimeoutMs: 10_000,          // Expect pong within 10s
    delayPollIntervalMs: 100,              // Poll delayed bars every 100ms
    maxDelaySeconds: 3600,                 // Max 1 hour delay
    delayedBarRetentionMs: 1_200_000,      // Keep 20 min of bars for delayed clients
  };