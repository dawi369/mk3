import { redisStore } from "@/server/data/redis_store.js";
import { timescaleStore } from "@/server/data/timescale_store.js";
import { HUB_PORT, HUB_API_KEY } from "@/config/env.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
import { frontMonthJob } from "@/jobs/front_month_job.js";
import { snapshotJob } from "@/jobs/snapshot_job.js";
import type { MassiveWSClient } from "@/server/api/massive/ws_client.js";
import type { Server, ServerWebSocket } from "bun";
import { logger } from "@/utils/logger.js";
import { recoveryService } from "@/services/recovery_service.js";

let massiveClient: MassiveWSClient | null = null;

export function setMassiveClientForTesting(client: MassiveWSClient | null): void {
  massiveClient = client;
}

// Helper for CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

const ALLOWED_TIMEFRAMES = new Set([
  "1s",
  "15s",
  "30s",
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "1d",
]);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function parseTimeframe(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return ALLOWED_TIMEFRAMES.has(trimmed) ? trimmed : fallback;
}

function parseMsParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function jsonResponse(data: any, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

function errorResponse(message: string, status = 500) {
  return Response.json({ error: message }, { status, headers: corsHeaders });
}

// Auth middleware replacement
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("X-API-Key");

  if (apiKeyHeader === HUB_API_KEY) return true;
  if (authHeader === `Bearer ${HUB_API_KEY}`) return true;

  return false;
}

export function startHubRESTApi(client: MassiveWSClient): Promise<void> {
  massiveClient = client;

  const server = Bun.serve({
    port: HUB_PORT,
    async fetch(req: Request, server: Server<undefined>) {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      // Handle WebSocket upgrade
      if (server.upgrade(req, { data: undefined })) {
        return undefined; // do not return a Response
      }

      // Handle CORS preflight (don't log these)
      if (method === "OPTIONS") {
        return new Response(null, {
          headers: corsHeaders,
        });
      }

      // Start timing for request logging
      const startTime = performance.now();
      const response = await handleRequest(method, path, req);
      const durationMs = Math.round(performance.now() - startTime);

      // Log the request
      logger.request(method, path, response.status, durationMs);

      return response;
    },
    websocket: {
      async open(ws: ServerWebSocket<unknown>) {
        logger.info("WebSocket client connected");
        ws.subscribe("market_data");
        ws.send(
          JSON.stringify({
            type: "info",
            message: "Connected to Market Data Stream",
          }),
        );

        // Send recent history as snapshot (last 100 messages)
        try {
          const recentMessages = await redisStore.redis.xrevrange(
            "market_data",
            "+",
            "-",
            "COUNT",
            100,
          );

          for (const [id, fields] of recentMessages.reverse()) {
            const data: Record<string, any> = {};
            for (let i = 0; i < fields.length; i += 2) {
              const key = fields[i];
              const value = fields[i + 1];
              if (key !== undefined) {
                data[key] = value;
              }
            }

            const payload = JSON.stringify({
              type: "market_data",
              id,
              data: data.data ? JSON.parse(data.data) : data,
              snapshot: true,
            });

            ws.send(payload);
          }
        } catch (error) {
          logger.error("Error sending WebSocket snapshot", {
            error: String(error),
          });
        }
      },
      message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
        // Handle incoming messages if needed
      },
      close(ws: ServerWebSocket<unknown>) {
        logger.info("WebSocket client disconnected");
      },
    },
  });

  logger.info(`Hub REST & WebSocket API listening on port ${server.port}`);

  // Start Redis Stream Consumer for Broadcasting
  startStreamBroadcaster(server);

  return Promise.resolve();
}

/**
 * Handle incoming HTTP requests
 */
export async function handleRequest(
  method: string,
  path: string,
  req: Request,
): Promise<Response> {
  const url = new URL(req.url);
  // --- Public Routes ---

  if (method === "GET" && path === "/health") {
    // Check database connections
    let redisOk = false;
    let timescaleOk = false;
    const timescaleEnabled = timescaleStore.isEnabled;

    try {
      const pong = await redisStore.ping();
      redisOk = pong === "PONG";
    } catch {
      redisOk = false;
    }

    if (timescaleEnabled) {
      try {
        timescaleOk = await timescaleStore.ping();
      } catch {
        timescaleOk = false;
      }
    }

    // Get stats and job statuses
    const redisStats = await redisStore.getStats();
    const symbols = await redisStore.getSymbols();
    const recoveryCheckpoints = await redisStore.getAllRecoveryCheckpoints();
    const clearJobStatus = dailyClearJob.getStatus();
    const refreshJobStatus = monthlySubscriptionJob.getStatus();

    // Check WebSocket connection
    const wsConnected = massiveClient?.isConnected() || false;

    // Determine overall status
    const allHealthy =
      redisOk && wsConnected && (!timescaleEnabled || timescaleOk);
    const status = allHealthy ? "ok" : "degraded";

    return jsonResponse({
      status,
      timestamp: Date.now(),
      services: {
        redis: redisOk ? "connected" : "disconnected",
        timescaledb: timescaleEnabled
          ? timescaleOk
            ? "connected"
            : "disconnected"
          : "disabled",
        massiveWs: wsConnected ? "connected" : "disconnected",
      },
      symbols: symbols,
      symbolCount: redisStats.symbolCount,
      redis: redisStats,
      recovery: {
        checkpointCount: Object.keys(recoveryCheckpoints).length,
      },
      dailyClearJob: clearJobStatus,
      subscriptionRefreshJob: refreshJobStatus,
    });
  }

  if (method === "GET" && path === "/bars/latest") {
    const bars = await redisStore.getAllLatestArray();
    return jsonResponse({ bars, count: bars.length });
  }

  // Match /bars/range/:symbol
  const rangeMatch = path.match(/^\/bars\/range\/([^\/]+)$/);
  if (method === "GET" && rangeMatch) {
    const symbol = rangeMatch[1];
    if (!symbol) return errorResponse("Invalid symbol", 400);

    const start = parseMsParam(url.searchParams.get("start"));
    const end = parseMsParam(url.searchParams.get("end"));
    const tf = parseTimeframe(url.searchParams.get("tf"), "1m");

    if (start === null || end === null) {
      return errorResponse("start and end query params are required (ms)", 400);
    }

    const bars = await redisStore.getBarsRange(symbol, start, end, tf as any);
    return jsonResponse({ symbol, tf, start, end, bars, count: bars.length });
  }

  // Match /bars/week/:symbol
  const weekMatch = path.match(/^\/bars\/week\/([^\/]+)$/);
  if (method === "GET" && weekMatch) {
    const symbol = weekMatch[1];
    if (!symbol) return errorResponse("Invalid symbol", 400);

    const tf = parseTimeframe(url.searchParams.get("tf"), "1m");
    const end = Date.now();
    const start = end - ONE_WEEK_MS;
    const bars = await redisStore.getBarsRange(symbol, start, end, tf as any);
    return jsonResponse({ symbol, tf, start, end, bars, count: bars.length });
  }

  // Match /bars/latest/:symbol
  const latestMatch = path.match(/^\/bars\/latest\/([^\/]+)$/);
  if (method === "GET" && latestMatch) {
    const symbol = latestMatch[1];
    if (!symbol) return errorResponse("Invalid symbol", 400);

    const bar = await redisStore.getLatest(symbol);
    if (!bar) {
      return errorResponse("Symbol not found", 404);
    }
    return jsonResponse(bar);
  }

  // Match /bars/today/:symbol
  const todayMatch = path.match(/^\/bars\/today\/([^\/]+)$/);
  if (method === "GET" && todayMatch) {
    const symbol = todayMatch[1];
    if (!symbol) return errorResponse("Invalid symbol", 400);

    const tf = parseTimeframe(url.searchParams.get("tf"), "1s");
    const bars = await redisStore.getTodayBars(symbol, tf as any);
    return jsonResponse({ symbol, tf, bars, count: bars.length });
  }

  const sessionBarsMatch = path.match(/^\/bars\/session\/([^\/]+)$/);
  if (method === "GET" && sessionBarsMatch) {
    const symbol = sessionBarsMatch[1];
    if (!symbol) return errorResponse("Invalid symbol", 400);

    const tf = parseTimeframe(url.searchParams.get("tf"), "1s");
    const ts = parseMsParam(url.searchParams.get("ts")) ?? Date.now();
    const bars = await redisStore.getSessionBars(symbol, ts, tf as any);
    return jsonResponse({ symbol, tf, bars, count: bars.length });
  }

  if (method === "GET" && path === "/symbols") {
    const symbols = await redisStore.getSymbols();
    return jsonResponse({ symbols, count: symbols.length });
  }

  // Front months endpoint (public - no auth required)
  if (method === "GET" && path === "/front-months") {
    const cache = frontMonthJob.getCache();
    if (!cache) {
      return jsonResponse({
        lastUpdated: null,
        products: {},
        message:
          "Cache not yet populated. Refresh will occur at 3 AM ET or trigger manually via admin endpoint.",
      });
    }
    return jsonResponse(cache);
  }

  if (method === "GET" && path === "/contracts/active") {
    const contracts = await redisStore.getAllActiveContracts();
    return jsonResponse({
      products: contracts,
      count: Object.keys(contracts).length,
    });
  }

  if (method === "GET" && path === "/recovery/checkpoints") {
    const checkpoints = await redisStore.getAllRecoveryCheckpoints();
    return jsonResponse({
      checkpoints,
      count: Object.keys(checkpoints).length,
    });
  }

  const activeContractsMatch = path.match(/^\/contracts\/active\/([^\/]+)$/);
  if (method === "GET" && activeContractsMatch) {
    const productCode = activeContractsMatch[1];
    if (!productCode) return errorResponse("Invalid product code", 400);

    const contracts = await redisStore.getActiveContracts(productCode);
    if (!contracts) {
      return errorResponse("Contracts not found", 404);
    }

    return jsonResponse(contracts);
  }

  // Session data endpoint (public - no auth required)
  if (method === "GET" && path === "/sessions") {
    const sessions = await redisStore.getAllSessions();
    return jsonResponse({ sessions, count: Object.keys(sessions).length });
  }

  const sessionHistoryMatch = path.match(/^\/sessions\/week\/([^\/]+)$/);
  if (method === "GET" && sessionHistoryMatch) {
    const symbol = sessionHistoryMatch[1];
    if (!symbol) return errorResponse("Invalid symbol", 400);

    const end = parseMsParam(url.searchParams.get("end")) ?? Date.now();
    const start = parseMsParam(url.searchParams.get("start")) ?? end - ONE_WEEK_MS;
    const sessions = await redisStore.getSessionHistory(symbol, start, end);
    return jsonResponse({ symbol, start, end, sessions, count: sessions.length });
  }

  // Match /session/:symbol
  const sessionMatch = path.match(/^\/session\/([^\/]+)$/);
  if (method === "GET" && sessionMatch) {
    const symbol = sessionMatch[1];
    if (!symbol) return errorResponse("Invalid symbol", 400);

    const ts = parseMsParam(url.searchParams.get("ts")) ?? Date.now();
    const session = await redisStore.getSession(symbol, ts);
    if (!session) {
      return errorResponse("Session not found", 404);
    }
    return jsonResponse(session);
  }

  // Snapshot data endpoint (public - no auth required)
  if (method === "GET" && path === "/snapshots") {
    const snapshots = await redisStore.getAllSnapshots();
    return jsonResponse({ snapshots, count: Object.keys(snapshots).length });
  }

  // Match /snapshot/:symbol
  const snapshotMatch = path.match(/^\/snapshot\/([^\/]+)$/);
  if (method === "GET" && snapshotMatch) {
    const symbol = snapshotMatch[1];
    if (!symbol) return errorResponse("Invalid symbol", 400);

    const snapshot = await redisStore.getSnapshot(symbol);
    if (!snapshot) {
      return errorResponse("Snapshot not found", 404);
    }
    return jsonResponse(snapshot);
  }

  // --- Protected Routes ---

  // Check auth for all /admin routes
  if (path.startsWith("/admin")) {
    if (!isAuthorized(req)) {
      return errorResponse("Unauthorized", 401);
    }

    if (method === "POST" && path === "/admin/clear-redis") {
      // Manual clear always uses force=true to bypass daily check
      await dailyClearJob.runClear(true);
      const status = dailyClearJob.getStatus();
      return jsonResponse({ message: "Manual clear triggered", status });
    }

    if (method === "POST" && path === "/admin/refresh-subscriptions") {
      try {
        await monthlySubscriptionJob.runRefresh();
        const status = monthlySubscriptionJob.getStatus();
        return jsonResponse({
          message: "Manual subscription refresh triggered",
          status,
        });
      } catch (err) {
        return jsonResponse(
          {
            error: "Refresh failed",
            details: err instanceof Error ? err.message : String(err),
          },
          500,
        );
      }
    }

    if (method === "GET" && path === "/admin/subscriptions") {
      if (!massiveClient) {
        return errorResponse("Massive client not initialized", 503);
      }

      const subscriptions = massiveClient.getSubscriptions();
      return jsonResponse({
        subscriptions,
        count: subscriptions.length,
        totalSymbols: subscriptions.reduce(
          (sum, sub) => sum + sub.symbols.length,
          0,
        ),
      });
    }

    if (method === "POST" && path === "/admin/refresh-front-months") {
      // Run in background to prevent timeout
      frontMonthJob.runRefresh().catch((err) => {
        console.error("[FrontMonthJob] Background refresh failed:", err);
      });

      return jsonResponse({
        message: "Front month refresh started (running in background)",
        status: frontMonthJob.getStatus(),
        cache: frontMonthJob.getCache(), // Return current cache immediately
      });
    }

    if (method === "POST" && path === "/admin/refresh-snapshots") {
      // Run job in background (don't await) - prevents HTTP timeout
      snapshotJob.runRefresh().catch((err) => {
        console.error("[SnapshotJob] Background refresh failed:", err);
      });

      return jsonResponse({
        message: "Snapshot refresh started (running in background)",
        status: snapshotJob.getStatus(),
      });
    }

    if (method === "POST" && path === "/admin/recovery/backfill") {
      const symbols = await redisStore.getSubscribedSymbols();
      const results = await recoveryService.backfillSymbolsFromProvider(symbols, {
        source: "manual",
        excludeCurrentMinute: true,
      });

      return jsonResponse({
        message: "Manual recovery backfill completed",
        symbols,
        results,
        providerBars: results.reduce((sum, result) => sum + result.providerBars, 0),
      });
    }
  }

  return errorResponse("Not Found", 404);
}

async function startStreamBroadcaster(server: Server<undefined>) {
  logger.info("Starting Redis Stream Broadcaster...");
  // Create a dedicated Redis client for blocking operations
  const subRedis = redisStore.redis.duplicate();
  let lastId = "$"; // Start reading from new messages

  while (true) {
    try {
      // Block for 5 seconds waiting for new messages
      const streams = await subRedis.xread(
        "BLOCK",
        5000,
        "STREAMS",
        "market_data",
        lastId,
      );

      if (streams && streams[0]) {
        const [streamName, messages] = streams[0];

        for (const [id, fields] of messages) {
          lastId = id;

          // Parse fields
          const data: Record<string, any> = {};
          for (let i = 0; i < fields.length; i += 2) {
            const key = fields[i];
            const value = fields[i + 1];
            if (key !== undefined) {
              data[key] = value;
            }
          }

          // Broadcast to all connected clients
          const payload = JSON.stringify({
            type: "market_data",
            id,
            data: data.data ? JSON.parse(data.data) : data,
            snapshot: false,
          });

          server.publish("market_data", payload);
        }
      }
    } catch (error) {
      logger.error("Error in Stream Broadcaster", { error: String(error) });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retrying
    }
  }
}
