import { afterAll, afterEach, mock } from "bun:test";
import { setMassiveClientForTesting } from "@/server/api/rest_client.js";
import { redisStore } from "@/server/data/redis_store.js";
import { timescaleStore } from "@/server/data/timescale_store.js";

afterEach(() => {
  mock.restore();
});

afterAll(async () => {
  setMassiveClientForTesting(null);
  await timescaleStore.close();
  redisStore.redis.disconnect();
});
