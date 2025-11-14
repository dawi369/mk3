import express from "express";
import { flowStore } from "@/servers/hub/data/flow_store.js";
import { redisStore } from "@/servers/hub/data/redis_store.js";
import { HUB_REST_PORT } from "@/config/env.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";
import type { PolygonWSClient } from "@/api/polygon/ws_client.js";

const app = express();
let polygonClient: PolygonWSClient | null = null;

app.use(express.json());

app.get("/health", async (req, res) => {
  const redisStats = await redisStore.getStats();
  const symbols = flowStore.getSymbols();
  const clearJobStatus = dailyClearJob.getStatus();
  const refreshJobStatus = monthlySubscriptionJob.getStatus();

  res.json({
    status: "ok",
    timestamp: Date.now(),
    symbols: symbols,
    symbolCount: symbols.length,
    redis: redisStats,
    dailyClearJob: clearJobStatus,
    subscriptionRefreshJob: refreshJobStatus,
  });
});

app.get("/bars/latest", (req, res) => {
  const bars = flowStore.getAllLatest();
  res.json({ bars, count: bars.length });
});

app.get("/bars/latest/:symbol", (req, res) => {
  const bar = flowStore.getLatest(req.params.symbol);
  if (!bar) {
    res.status(404).json({ error: "Symbol not found" });
    return;
  }
  res.json(bar);
});

app.get("/bars/today/:symbol", async (req, res) => {
  const bars = await redisStore.getTodayBars(req.params.symbol);
  res.json({ symbol: req.params.symbol, bars, count: bars.length });
});

app.get("/symbols", (req, res) => {
  const symbols = flowStore.getSymbols();
  res.json({ symbols, count: symbols.length });
});

app.post("/admin/clear-redis", async (req, res) => {
  await dailyClearJob.runClear();
  const status = dailyClearJob.getStatus();
  res.json({ message: 'Manual clear triggered', status });
});

app.post("/admin/refresh-subscriptions", async (req, res) => {
  try {
    await monthlySubscriptionJob.runRefresh();
    const status = monthlySubscriptionJob.getStatus();
    res.json({ 
      message: 'Manual subscription refresh triggered', 
      status 
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Refresh failed', 
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

app.get("/admin/subscriptions", (req, res) => {
  if (!polygonClient) {
    res.status(503).json({ error: "Polygon client not initialized" });
    return;
  }
  
  const subscriptions = polygonClient.getSubscriptions();
  res.json({ 
    subscriptions,
    count: subscriptions.length,
    totalSymbols: subscriptions.reduce((sum, sub) => sum + sub.symbols.length, 0)
  });
});

export function startHubRESTApi(client: PolygonWSClient): Promise<void> {
  polygonClient = client;
  
  return new Promise((resolve) => {
    app.listen(HUB_REST_PORT, () => {
      console.log(`Hub REST API listening on port ${HUB_REST_PORT}`);
      resolve();
    });
  });
}
