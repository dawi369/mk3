import { flowStore } from "@/server/data/flow_store.js";
import { redisStore } from "@/server/data/redis_store.js";
import { HUB_REST_PORT, HUB_API_KEY } from "@/config/env.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
import type { PolygonWSClient } from "@/server/api/polygon/ws_client.js";

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
    port: HUB_REST_PORT,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      // Handle CORS preflight
      if (method === "OPTIONS") {
        return new Response(null, {
          headers: corsHeaders,
        });
      }

      // --- Public Routes ---

      if (method === "GET" && path === "/health") {
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
        const symbol = todayMatch[1];
        if (!symbol) return errorResponse("Invalid symbol", 400);

        const bars = await redisStore.getTodayBars(symbol);
        return jsonResponse({ symbol, bars, count: bars.length });
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
          await dailyClearJob.runClear();
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
              500
            );
          }
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
  });

  console.log(`Hub REST API listening on port ${server.port}`);
  return Promise.resolve();
}
