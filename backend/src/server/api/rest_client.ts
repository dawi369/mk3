import { flowStore } from "@/server/data/flow_store.js";
import { redisStore } from "@/server/data/redis_store.js";
import { HUB_PORT, HUB_API_KEY } from "@/config/env.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
import type { PolygonWSClient } from "@/server/api/polygon/ws_client.js";
import type { Server, ServerWebSocket } from "bun";

let polygonClient: PolygonWSClient | null = null;

// Helper for CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

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

export function startHubRESTApi(client: PolygonWSClient): Promise<void> {
  polygonClient = client;

  const server = Bun.serve({
    port: HUB_PORT,
    fetch(req: Request, server: Server) {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      // Handle WebSocket upgrade
      if (server.upgrade(req, { data: undefined })) {
        return undefined; // do not return a Response
      }

      // Handle CORS preflight
      if (method === "OPTIONS") {
        return new Response(null, {
          headers: corsHeaders,
        });
      }

      // --- Public Routes ---

      if (method === "GET" && path === "/health") {
        return (async () => {
          const redisStats = await redisStore.getStats();
          const symbols = flowStore.getSymbols();
          const clearJobStatus = dailyClearJob.getStatus();
          const refreshJobStatus = monthlySubscriptionJob.getStatus();

          return jsonResponse({
            status: "ok",
            timestamp: Date.now(),
            symbols: symbols,
            symbolCount: symbols.length,
            redis: redisStats,
            dailyClearJob: clearJobStatus,
            subscriptionRefreshJob: refreshJobStatus,
          });
        })();
      }

      if (method === "GET" && path === "/bars/latest") {
        const bars = flowStore.getAllLatest();
        return jsonResponse({ bars, count: bars.length });
      }

      // Match /bars/latest/:symbol
      const latestMatch = path.match(/^\/bars\/latest\/([^\/]+)$/);
      if (method === "GET" && latestMatch) {
        const symbol = latestMatch[1];
        if (!symbol) return errorResponse("Invalid symbol", 400);

        const bar = flowStore.getLatest(symbol);
        if (!bar) {
          return errorResponse("Symbol not found", 404);
        }
        return jsonResponse(bar);
      }

      // Match /bars/today/:symbol
      const todayMatch = path.match(/^\/bars\/today\/([^\/]+)$/);
      if (method === "GET" && todayMatch) {
        return (async () => {
          const symbol = todayMatch[1];
          if (!symbol) return errorResponse("Invalid symbol", 400);

          const bars = await redisStore.getTodayBars(symbol);
          return jsonResponse({ symbol, bars, count: bars.length });
        })();
      }

      if (method === "GET" && path === "/symbols") {
        const symbols = flowStore.getSymbols();
        return jsonResponse({ symbols, count: symbols.length });
      }

      // --- Protected Routes ---

      // Check auth for all /admin routes
      if (path.startsWith("/admin")) {
        if (!isAuthorized(req)) {
          return errorResponse("Unauthorized", 401);
        }

        if (method === "POST" && path === "/admin/clear-redis") {
          return (async () => {
            await dailyClearJob.runClear();
            const status = dailyClearJob.getStatus();
            return jsonResponse({ message: "Manual clear triggered", status });
          })();
        }

        if (method === "POST" && path === "/admin/refresh-subscriptions") {
          return (async () => {
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
                500
              );
            }
          })();
        }

        if (method === "GET" && path === "/admin/subscriptions") {
          if (!polygonClient) {
            return errorResponse("Polygon client not initialized", 503);
          }

          const subscriptions = polygonClient.getSubscriptions();
          return jsonResponse({
            subscriptions,
            count: subscriptions.length,
            totalSymbols: subscriptions.reduce((sum, sub) => sum + sub.symbols.length, 0),
          });
        }
      }

      return errorResponse("Not Found", 404);
    },
    websocket: {
      async open(ws: ServerWebSocket<unknown>) {
        console.log("Client connected to Hub WebSocket");
        ws.subscribe("market_data");
        ws.send(JSON.stringify({ type: "info", message: "Connected to Market Data Stream" }));

        // Send recent history as snapshot (last 100 messages)
        try {
          // Use redisStore's redis instance directly
          const recentMessages = await redisStore.redis.xrevrange(
            "market_data",
            "+",
            "-",
            "COUNT",
            100
          );

          for (const [id, fields] of recentMessages.reverse()) {
            const data: Record<string, any> = {};
            for (let i = 0; i < fields.length; i += 2) {
              data[fields[i]] = fields[i + 1];
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
          console.error("Error sending snapshot:", error);
        }
      },
      message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
        // Handle incoming messages if needed
      },
      close(ws: ServerWebSocket<unknown>) {
        console.log("Client disconnected from Hub WebSocket");
      },
    },
  });

  console.log(`Hub REST & WebSocket API listening on port ${server.port}`);

  // Start Redis Stream Consumer for Broadcasting
  // We use a separate Redis connection for blocking XREAD to avoid blocking the main one
  startStreamBroadcaster(server);

  return Promise.resolve();
}

async function startStreamBroadcaster(server: Server) {
  console.log("Starting Redis Stream Broadcaster...");
  // Create a dedicated Redis client for blocking operations
  const subRedis = redisStore.redis.duplicate();
  let lastId = "$"; // Start reading from new messages

  while (true) {
    try {
      // Block for 5 seconds waiting for new messages
      const streams = await subRedis.xread("BLOCK", 5000, "STREAMS", "market_data", lastId);

      if (streams) {
        const [streamName, messages] = streams[0];

        for (const [id, fields] of messages) {
          lastId = id;

          // Parse fields
          const data: Record<string, any> = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
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
      console.error("Error in Stream Broadcaster:", error);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retrying
    }
  }
}
