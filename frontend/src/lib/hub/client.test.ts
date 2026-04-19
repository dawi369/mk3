import { beforeEach, describe, expect, test, vi } from "vitest";
import { HubClient, toWebSocketUrl } from "@/lib/hub/client";

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  message(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent<string>);
  }

  error() {
    this.onerror?.();
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
}

describe("HubClient", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T12:00:00Z"));
  });

  test("converts hub URLs into websocket URLs", () => {
    expect(toWebSocketUrl("http://localhost:3005")).toBe("ws://localhost:3005");
    expect(toWebSocketUrl("https://api.example.com")).toBe("wss://api.example.com");
    expect(toWebSocketUrl("ws://localhost:3005")).toBe("ws://localhost:3005");
  });

  test("connects, parses valid messages, and exposes connection status", () => {
    const client = new HubClient("http://localhost:3005", {
      webSocketFactory: (url) => new FakeWebSocket(url) as unknown as WebSocket,
    });

    const statuses: string[] = [];
    const messages: string[] = [];
    client.onStatusChange((status) => {
      statuses.push(status);
    });
    client.subscribe((message) => {
      messages.push(message.type);
    });

    client.connect();

    const socket = FakeWebSocket.instances[0];
    expect(socket?.url).toBe("ws://localhost:3005");

    socket.open();
    socket.message({ type: "info", message: "connected" });
    socket.message({
      type: "market_data",
      data: {
        symbol: "ESH6",
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        volume: 1000,
        trades: 10,
        startTime: 1,
        endTime: 2,
      },
    });
    socket.message({ nope: true });

    expect(statuses).toContain("connecting");
    expect(statuses).toContain("connected");
    expect(messages).toEqual(["info", "market_data"]);
    expect(client.getLastMessageAt()).toBe(Date.now());
  });

  test("reconnects after an unexpected close", () => {
    const client = new HubClient("http://localhost:3005", {
      webSocketFactory: (url) => new FakeWebSocket(url) as unknown as WebSocket,
      setTimeoutImpl: setTimeout,
      clearTimeoutImpl: clearTimeout,
    });

    client.connect();
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();
    firstSocket.close();

    expect(client.getStatus()).toBe("disconnected");

    vi.advanceTimersByTime(1000);

    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  test("does not reconnect after an explicit disconnect", () => {
    const client = new HubClient("http://localhost:3005", {
      webSocketFactory: (url) => new FakeWebSocket(url) as unknown as WebSocket,
      setTimeoutImpl: setTimeout,
      clearTimeoutImpl: clearTimeout,
    });

    client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    client.disconnect();
    vi.advanceTimersByTime(5000);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(client.getStatus()).toBe("disconnected");
  });
});
