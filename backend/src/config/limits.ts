// src/config/limits.ts
export const LIMITS = {
    maxClients: 200,             // hard cap for concurrent client sockets
    maxSubscriptionsPerClient: 50,
    maxSymbolsGlobal: 2000,      // protects upstream sub list size
    heartbeatMs: 15_000,
    reconnectBackoffMs: { base: 500, max: 20_000 },
    maxEdgeBars: 10_000,
  };