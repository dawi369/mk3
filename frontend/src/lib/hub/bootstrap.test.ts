import { describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/setup";
import { loadHubBootstrap, loadHubSessions, loadHubSnapshots } from "@/lib/hub/bootstrap";
import { makeSession, makeSnapshot } from "@/tests/factories";

describe("hub bootstrap loader", () => {
  test("loads symbols, snapshots, and sessions into one bootstrap payload", async () => {
    server.use(
      http.get("http://localhost:3005/symbols", () =>
        HttpResponse.json({ symbols: ["ESH6", "NQH6"] }),
      ),
      http.get("http://localhost:3005/snapshots", () =>
        HttpResponse.json({
          snapshots: { ESH6: makeSnapshot(), NQH6: makeSnapshot({ productCode: "NQ" }) },
        }),
      ),
      http.get("http://localhost:3005/sessions", () =>
        HttpResponse.json({
          sessions: { ESH6: makeSession(), NQH6: makeSession({ rootSymbol: "NQ" }) },
        }),
      ),
    );

    const payload = await loadHubBootstrap({
      baseUrl: "http://localhost:3005",
      curveSymbols: ["ES", "NQ"],
    });

    expect(payload.frontSymbols).toEqual(["ESH6", "NQH6"]);
    expect(payload.curveSymbols).toEqual(["ES", "NQ"]);
    expect(payload.snapshots.ESH6?.productCode).toBe("ES");
    expect(payload.sessions.NQH6?.rootSymbol).toBe("NQ");
  });

  test("degrades to empty payloads when one of the endpoints fails", async () => {
    server.use(
      http.get("http://localhost:3005/symbols", () => new HttpResponse(null, { status: 500 })),
      http.get("http://localhost:3005/snapshots", () =>
        HttpResponse.json({ snapshots: { ESH6: makeSnapshot() } }),
      ),
      http.get("http://localhost:3005/sessions", () => new HttpResponse(null, { status: 503 })),
    );

    const payload = await loadHubBootstrap({
      baseUrl: "http://localhost:3005",
      curveSymbols: ["ES"],
    });

    expect(payload.frontSymbols).toEqual([]);
    expect(payload.snapshots.ESH6).toBeDefined();
    expect(payload.sessions).toEqual({});
  });

  test("supports standalone metadata refresh helpers", async () => {
    server.use(
      http.get("http://localhost:3005/snapshots", () =>
        HttpResponse.json({ snapshots: { ESH6: makeSnapshot() } }),
      ),
      http.get("http://localhost:3005/sessions", () =>
        HttpResponse.json({ sessions: { ESH6: makeSession() } }),
      ),
    );

    const [snapshots, sessions] = await Promise.all([
      loadHubSnapshots("http://localhost:3005"),
      loadHubSessions("http://localhost:3005"),
    ]);

    expect(snapshots.ESH6?.productCode).toBe("ES");
    expect(sessions.ESH6?.sessionId).toBe("2026-03-25");
  });
});
