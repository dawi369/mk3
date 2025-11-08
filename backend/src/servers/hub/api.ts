import express from "express";
import { flowStore } from "@/data/flow_store.js";
import { redisStore } from "@/data/redis_store.js";
import { HUB_REST_PORT } from "@/config/env.js";
import { dailyClearJob } from "@/jobs/clear_daily.js";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
  const redisStats = await redisStore.getStats();
  const symbols = flowStore.getSymbols();
  const clearJobStatus = dailyClearJob.getStatus();

  res.json({
    status: "ok",
    timestamp: Date.now(),
    symbols: symbols,
    symbolCount: symbols.length,
    redis: redisStats,
    dailyClearJob: clearJobStatus,
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

export function startHubRESTApi(): void {
  app.listen(HUB_REST_PORT, () => {
    console.log(`Hub REST API listening on port ${HUB_REST_PORT}`);
  });
}
