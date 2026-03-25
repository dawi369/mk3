import { describe, expect, spyOn, test } from "bun:test";
import {
  handleRequest,
  setMassiveClientForTesting,
} from "@/server/api/rest_client.js";
import { redisStore } from "@/server/data/redis_store.js";
import { timescaleStore } from "@/server/data/timescale_store.js";
import { recoveryService } from "@/services/recovery_service.js";
import { frontMonthJob } from "@/jobs/front_month_job.js";
import { monthlySubscriptionJob } from "@/jobs/refresh_subscriptions.js";

function createRequest(
  path: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
  },
): Request {
  return new Request(`http://localhost${path}`, {
    method: init?.method ?? "GET",
    headers: init?.headers,
  });
}

describe("REST request handler", () => {
  test("returns health status with recovery checkpoint counts", async () => {
    setMassiveClientForTesting({
      isConnected: () => true,
    } as any);

    spyOn(redisStore, "ping").mockResolvedValue("PONG");
    spyOn(redisStore, "getStats").mockResolvedValue({
      date: "2026-03-25",
      barCount: 10,
      symbolCount: 2,
      streamLength: 0,
    } as any);
    spyOn(redisStore, "getSymbols").mockResolvedValue(["ESH6", "NQH6"]);
    spyOn(timescaleStore, "ping").mockResolvedValue(true);
    spyOn(redisStore, "getAllRecoveryCheckpoints").mockResolvedValue({
      "1m:ESH6": { symbol: "ESH6" },
      "1m:NQH6": { symbol: "NQH6" },
    } as any);

    const response = await handleRequest(
      "GET",
      "/health",
      createRequest("/health"),
    );
    const payload = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ok");
    expect(payload.recovery.checkpointCount).toBe(2);
    expect(payload.services.massiveWs).toBe("connected");
  });

  test("returns recovery checkpoints", async () => {
    spyOn(redisStore, "getAllRecoveryCheckpoints").mockResolvedValue({
      "1m:ESH6": {
        symbol: "ESH6",
        timeframe: "1m",
        lastSeenBarTs: 1,
        updatedAt: 2,
        source: "live",
      },
    } as any);

    const response = await handleRequest(
      "GET",
      "/recovery/checkpoints",
      createRequest("/recovery/checkpoints"),
    );
    const payload = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(payload.count).toBe(1);
    expect(payload.checkpoints["1m:ESH6"].symbol).toBe("ESH6");
  });

  test("validates required range query params", async () => {
    const response = await handleRequest(
      "GET",
      "/bars/range/ESH9",
      createRequest("/bars/range/ESH9"),
    );
    const payload = (await response.json()) as any;

    expect(response.status).toBe(400);
    expect(payload.error).toContain("start and end");
  });

  test("returns latest bars and symbol-specific latest responses", async () => {
    spyOn(redisStore, "getAllLatestArray").mockResolvedValue([
      {
        symbol: "ESH9",
        close: 10.5,
      },
    ] as any);
    spyOn(redisStore, "getLatest").mockResolvedValue({
      symbol: "ESH9",
      close: 10.5,
    } as any);

    const latestResponse = await handleRequest(
      "GET",
      "/bars/latest",
      createRequest("/bars/latest"),
    );
    const symbolResponse = await handleRequest(
      "GET",
      "/bars/latest/ESH9",
      createRequest("/bars/latest/ESH9"),
    );
    const latestPayload = (await latestResponse.json()) as any;
    const symbolPayload = (await symbolResponse.json()) as any;

    expect(latestPayload.count).toBe(1);
    expect(symbolPayload.symbol).toBe("ESH9");
  });

  test("returns 404 for unknown latest/session/snapshot resources", async () => {
    spyOn(redisStore, "getLatest").mockResolvedValue(null);
    spyOn(redisStore, "getSession").mockResolvedValue(null);
    spyOn(redisStore, "getSnapshot").mockResolvedValue(null);

    const latest = await handleRequest(
      "GET",
      "/bars/latest/NOPE",
      createRequest("/bars/latest/NOPE"),
    );
    const session = await handleRequest(
      "GET",
      "/session/NOPE",
      createRequest("/session/NOPE"),
    );
    const snapshot = await handleRequest(
      "GET",
      "/snapshot/NOPE",
      createRequest("/snapshot/NOPE"),
    );

    expect(latest.status).toBe(404);
    expect(session.status).toBe(404);
    expect(snapshot.status).toBe(404);
  });

  test("returns empty front-month bootstrap payload when cache is missing", async () => {
    spyOn(frontMonthJob, "getCache").mockReturnValue(null);

    const response = await handleRequest(
      "GET",
      "/front-months",
      createRequest("/front-months"),
    );
    const payload = (await response.json()) as any;

    expect(payload.lastUpdated).toBeNull();
    expect(payload.products).toEqual({});
    expect(payload.message).toContain("Cache not yet populated");
  });

  test("returns contract metadata and admin subscriptions when authorized", async () => {
    spyOn(redisStore, "getActiveContracts").mockResolvedValue({
      productCode: "ES",
      contracts: [{ ticker: "ESH9" }],
    } as any);

    setMassiveClientForTesting({
      getSubscriptions: () => [
        { ev: "A", symbols: ["ESH9", "NQH9"], assetClass: "us_indices" },
      ],
    } as any);

    const contractsResponse = await handleRequest(
      "GET",
      "/contracts/active/ES",
      createRequest("/contracts/active/ES"),
    );
    const adminResponse = await handleRequest(
      "GET",
      "/admin/subscriptions",
      createRequest("/admin/subscriptions", {
        headers: { "X-API-Key": Bun.env.HUB_API_KEY ?? "" },
      }),
    );
    const contractsPayload = (await contractsResponse.json()) as any;
    const adminPayload = (await adminResponse.json()) as any;

    expect(contractsPayload.productCode).toBe("ES");
    expect(adminPayload.totalSymbols).toBe(2);
  });

  test("rejects unauthenticated admin recovery backfill requests", async () => {
    const response = await handleRequest(
      "POST",
      "/admin/recovery/backfill",
      createRequest("/admin/recovery/backfill", { method: "POST" }),
    );

    expect(response.status).toBe(401);
  });

  test("runs manual recovery backfill for authorized requests", async () => {
    spyOn(redisStore, "getSubscribedSymbols").mockResolvedValue(["ESH6", "NQH6"]);
    const backfillSpy = spyOn(
      recoveryService,
      "backfillSymbolsFromProvider",
    ).mockResolvedValue([
      {
        symbol: "ESH6",
        source: "manual",
        startMs: 1,
        endMs: 2,
        providerBars: 3,
        checkpointBefore: 0,
        checkpointAfter: 1,
      },
      {
        symbol: "NQH6",
        source: "manual",
        startMs: 1,
        endMs: 2,
        providerBars: 4,
        checkpointBefore: 0,
        checkpointAfter: 1,
      },
    ]);

    const response = await handleRequest(
      "POST",
      "/admin/recovery/backfill",
      createRequest("/admin/recovery/backfill", {
        method: "POST",
        headers: {
          "X-API-Key": Bun.env.HUB_API_KEY ?? "",
        },
      }),
    );
    const payload = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(backfillSpy).toHaveBeenCalledWith(["ESH6", "NQH6"], {
      source: "manual",
      excludeCurrentMinute: true,
    });
    expect(payload.providerBars).toBe(7);
  });

  test("returns not found for unknown routes and handles refresh-subscription failures", async () => {
    spyOn(monthlySubscriptionJob, "runRefresh").mockRejectedValue(
      new Error("refresh failed"),
    );

    const notFound = await handleRequest(
      "GET",
      "/definitely-missing",
      createRequest("/definitely-missing"),
    );
    const refresh = await handleRequest(
      "POST",
      "/admin/refresh-subscriptions",
      createRequest("/admin/refresh-subscriptions", {
        method: "POST",
        headers: { "X-API-Key": Bun.env.HUB_API_KEY ?? "" },
      }),
    );

    expect(notFound.status).toBe(404);
    expect(refresh.status).toBe(500);
    expect(((await refresh.json()) as any).details).toContain("refresh failed");
  });
});
