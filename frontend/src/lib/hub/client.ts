import type { HubConnectionStatus, HubMessage } from "@/types/hub.types";
import { parseHubMessageEvent } from "@/lib/hub/messages";

type StatusListener = (
  status: HubConnectionStatus,
  details: { error: Error | null; lastMessageAt: number | null },
) => void;

type MessageListener = (message: HubMessage) => void;

interface HubClientOptions {
  webSocketFactory?: (url: string) => WebSocket;
  setTimeoutImpl?: typeof setTimeout;
  clearTimeoutImpl?: typeof clearTimeout;
  maxReconnectDelayMs?: number;
}

export function toWebSocketUrl(url: string): string {
  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    return url;
  }
  if (url.startsWith("https://")) {
    return url.replace("https://", "wss://");
  }
  if (url.startsWith("http://")) {
    return url.replace("http://", "ws://");
  }
  return `ws://${url}`;
}

export class HubClient {
  private ws: WebSocket | null = null;
  private status: HubConnectionStatus = "disconnected";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private lastMessageAt: number | null = null;
  private lastError: Error | null = null;
  private readonly statusListeners = new Set<StatusListener>();
  private readonly messageListeners = new Set<MessageListener>();
  private readonly webSocketFactory: (url: string) => WebSocket;
  private readonly setTimeoutImpl: typeof setTimeout;
  private readonly clearTimeoutImpl: typeof clearTimeout;
  private readonly maxReconnectDelayMs: number;
  private manuallyClosed = false;

  constructor(
    private readonly baseUrl: string,
    options: HubClientOptions = {},
  ) {
    this.webSocketFactory =
      options.webSocketFactory ?? ((url) => new WebSocket(url));
    const setTimeoutImpl = options.setTimeoutImpl ?? globalThis.setTimeout;
    const clearTimeoutImpl =
      options.clearTimeoutImpl ?? globalThis.clearTimeout;
    this.setTimeoutImpl = ((handler, timeout, ...args) =>
      setTimeoutImpl(handler, timeout, ...args)) as typeof setTimeout;
    this.clearTimeoutImpl = ((timeoutId) =>
      clearTimeoutImpl(timeoutId)) as typeof clearTimeout;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? 30_000;
  }

  getStatus(): HubConnectionStatus {
    return this.status;
  }

  getLastMessageAt(): number | null {
    return this.lastMessageAt;
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  subscribe(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, {
      error: this.lastError,
      lastMessageAt: this.lastMessageAt,
    });
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manuallyClosed = false;
    this.clearReconnectTimer();
    this.setStatus("connecting");

    const ws = this.webSocketFactory(toWebSocketUrl(this.baseUrl));
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.lastError = null;
      this.setStatus("connected");
    };

    ws.onmessage = (event) => {
      const message = parseHubMessageEvent(event as MessageEvent<string>);
      if (!message) {
        return;
      }

      this.lastMessageAt = Date.now();
      this.emitStatus();
      for (const listener of this.messageListeners) {
        listener(message);
      }
    };

    ws.onerror = () => {
      this.lastError = new Error("WebSocket connection error");
      this.setStatus("error");
    };

    ws.onclose = () => {
      this.ws = null;
      if (this.manuallyClosed) {
        this.setStatus("disconnected");
        return;
      }

      this.setStatus("disconnected");
      this.scheduleReconnect();
    };
  }

  reconnect(): void {
    this.disconnect({ reconnect: true });
    this.connect();
  }

  disconnect(options: { reconnect?: boolean } = {}): void {
    this.manuallyClosed = !options.reconnect;
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (!options.reconnect) {
      this.setStatus("disconnected");
    }
  }

  send(data: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(JSON.stringify(data));
    return true;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.manuallyClosed) {
      return;
    }

    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      this.maxReconnectDelayMs,
    );

    this.reconnectTimer = this.setTimeoutImpl(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts += 1;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) return;
    this.clearTimeoutImpl(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private emitStatus(): void {
    for (const listener of this.statusListeners) {
      listener(this.status, {
        error: this.lastError,
        lastMessageAt: this.lastMessageAt,
      });
    }
  }

  private setStatus(status: HubConnectionStatus): void {
    this.status = status;
    this.emitStatus();
  }
}
