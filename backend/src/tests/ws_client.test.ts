import { describe, expect, mock, spyOn, test } from "bun:test";
import { MassiveWSClient } from "@/server/api/massive/ws_client.js";
import { redisStore } from "@/server/data/redis_store.js";
import { timescaleStore } from "@/server/data/timescale_store.js";
import { recoveryService } from "@/services/recovery_service.js";
import type { Bar } from "@/types/common.types.js";
import { flowStore } from "@/server/data/flow_store.js";

function createBar(symbol: string, startTime: number): Bar {
  return {
    symbol,
    open: 10,
    high: 11,
    low: 9,
    close: 10.5,
    volume: 100,
    trades: 5,
    startTime,
    endTime: startTime + 1000,
  };
}

describe("MassiveWSClient", () => {
  test("handles auth and subscribe status messages by updating connection state", () => {
    const client = new MassiveWSClient();
    const authResolver = mock(() => {});
    const subscribeResolver = mock(() => {});
    (client as any).authResolver = authResolver;
    (client as any).subscribeResolver = subscribeResolver;

    (client as any).handleMessage({
      data: JSON.stringify([
        { ev: "status", status: "auth_success" },
        { ev: "status", status: "success", message: "subscribed to: A.ESH9" },
      ]),
    });

    expect(client.isConnected()).toBe(true);
    expect((client as any).state).toBe("subscribed");
    expect(authResolver).toHaveBeenCalled();
    expect(subscribeResolver).toHaveBeenCalled();
  });

  test("routes aggregate messages through flow store and persistence path", () => {
    const client = new MassiveWSClient();
    const persistSpy = spyOn(client as any, "handleAggregateBar").mockImplementation(
      () => undefined,
    );

    (client as any).handleMessage({
      data: JSON.stringify([
        {
          ev: "A",
          sym: "ESH9",
          v: 100,
          dv: 1050,
          n: 5,
          o: 10,
          c: 10.5,
          h: 11,
          l: 9,
          s: 1000,
          e: 2000,
        },
      ]),
    });

    expect(persistSpy).toHaveBeenCalledTimes(1);
    expect(flowStore.getLatest("ESH9")?.close).toBe(10.5);
  });

  test("buffers aggregate bars while recovery is in progress", () => {
    const client = new MassiveWSClient();
    (client as any).recoveryPhase = "buffering";
    const redisSpy = spyOn(redisStore, "writeBar").mockResolvedValue();
    const recoverySpy = spyOn(recoveryService, "persistLiveBar").mockResolvedValue();
    const timescaleSpy = spyOn(timescaleStore, "insertBar").mockResolvedValue();

    (client as any).handleAggregateBar(createBar("ESH9", 1000));

    expect((client as any).recoveryBuffer).toHaveLength(1);
    expect(redisSpy).not.toHaveBeenCalled();
    expect(recoverySpy).not.toHaveBeenCalled();
    expect(timescaleSpy).not.toHaveBeenCalled();
  });

  test("flushes buffered bars in sorted unique order", async () => {
    const client = new MassiveWSClient();
    (client as any).recoveryBuffer = [
      createBar("NQH9", 2000),
      createBar("ESH9", 1000),
      createBar("ESH9", 1000),
    ];
    const persisted: string[] = [];
    (client as any).persistAggregateBar = mock(async (bar: Bar) => {
      persisted.push(`${bar.symbol}:${bar.startTime}`);
    });

    const flushed = await (client as any).flushBufferedBars();

    expect(flushed).toBe(2);
    expect(persisted).toEqual(["ESH9:1000", "NQH9:2000"]);
    expect((client as any).recoveryPhase).toBe("idle");
    expect((client as any).recoveryBuffer).toHaveLength(0);
  });

  test("reconnect runs provider backfill and clears disconnect state", async () => {
    const client = new MassiveWSClient();
    (client as any).market = "futures";
    (client as any).subscriptions = [
      { ev: "A", symbols: ["ESH9"], assetClass: "us_indices" },
      { ev: "A", symbols: ["NQH9"], assetClass: "us_indices" },
    ];
    (client as any).lastDisconnectAt = 1234;
    (client as any).connect = mock(async () => {});
    (client as any).subscribe = mock(async () => {});
    (client as any).flushBufferedBars = mock(async () => 2);
    const backfillSpy = spyOn(
      recoveryService,
      "backfillSymbolsFromProvider",
    ).mockResolvedValue([
      {
        symbol: "ESH9",
        source: "reconnect",
        startMs: 1,
        endMs: 2,
        providerBars: 3,
        checkpointBefore: 0,
        checkpointAfter: 1,
      },
    ]);

    await (client as any).reconnect();

    expect(backfillSpy).toHaveBeenCalledWith(["ESH9", "NQH9"], {
      source: "reconnect",
      disconnectedAt: 1234,
      excludeCurrentMinute: true,
    });
    expect((client as any).lastDisconnectAt).toBeNull();
  });

  test("subscribe tracks unique subscriptions and sends websocket params", async () => {
    const client = new MassiveWSClient();
    const send = mock(() => {
      (client as any).subscribeResolver?.();
    });
    (client as any).ws = { send } as any;

    await client.subscribe({
      ev: "A",
      symbols: ["ESH9", "NQH9"],
      assetClass: "us_indices",
    });
    await client.subscribe({
      ev: "A",
      symbols: ["ESH9", "NQH9"],
      assetClass: "us_indices",
    });

    expect(send).toHaveBeenCalledTimes(2);
    expect(client.getSubscriptions()).toHaveLength(1);
    const firstPayload = String((send as any).mock.calls[0][0]);
    expect(firstPayload).toContain('"params":"A.ESH9,A.NQH9"');
  });
});
