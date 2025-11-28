import { POLYGON_API_KEY } from "@/config/env.js";
import { POLYGON_WS_URL } from "@/utils/consts.js";
import type {
  PolygonWsRequest,
  PolygonMarketType,
  PolygonStatusMessage,
} from "@/types/polygon.types.js";
import {
  buildSubscribeParams,
  isAggregateEvent,
  isStatusMessage,
  isQuoteEvent,
  isTradeEvent,
  aggregateToBar,
} from "@/utils/polygon.utils.js";
import { flowStore } from "@/server/data/flow_store.js";
import { redisStore } from "@/server/data/redis_store.js";
import { timescaleStore } from "@/server/data/timescale_store.js";
import { PolygonAggregateEventSchema } from "@/schemas/events.js";
import { ConnectionState } from "@/types/polygon.types.js";
import type { WSHealth } from "@/types/polygon.types.js";
import { isMarketHours } from "@/utils/polygon.utils.js";

export class PolygonWSClient {
  private ws: WebSocket | null = null;
  private health: WSHealth = {
    connected: false,
    lastMessageTime: null,
    subscriptionCount: 0,
    latencyMs: null,
  };

  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: Timer | null = null;
  private heartbeatTimer: Timer | null = null;
  private market: PolygonMarketType | null = null;
  private subscriptions: PolygonWsRequest[] = [];
  private authResolver: (() => void) | null = null;
  private subscribeResolver: (() => void) | null = null;
  private unsubscribeResolver: (() => void) | null = null;

  async connect(marketType: PolygonMarketType): Promise<void> {
    this.market = marketType;
    this.state = ConnectionState.CONNECTING;

    console.log(`Connecting to Polygon ${marketType}...`);

    const marketStatus = isMarketHours();
    if (!marketStatus.isOpen) {
      console.warn(
        `⚠️  Market closed: ${marketStatus.reason}. No live data expected.`
      );
    }

    // Build the WebSocket URL with market type path
    const wsUrl = `${POLYGON_WS_URL}/${marketType}`;
    this.ws = new WebSocket(wsUrl);

    // Create a promise that resolves when authenticated
    const authPromise = new Promise<void>((resolve) => {
      this.authResolver = resolve;
    });

    this.ws.onopen = () => {
      // Send auth message immediately after connection opens
      this.ws?.send(
        JSON.stringify({ action: "auth", params: POLYGON_API_KEY })
      );
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      const statusMessage = this.handleMessage(msg);
      if (statusMessage) {
        // console.log("Connect status message:", statusMessage);
      }
    };

    this.ws.onerror = (err: Event) => {
      console.error("WebSocket error:", err);
      this.health.connected = false;
      this.state = ConnectionState.DISCONNECTED;
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log(`Connection closed: ${event.code} ${event.reason}`);
      this.health.connected = false;
      this.state = ConnectionState.DISCONNECTED;
      this.scheduleReconnect();
    };

    // Wait for authentication before returning
    await authPromise;
  }

  private handleMessage(msg: MessageEvent): PolygonStatusMessage | void {
    this.health.lastMessageTime = Date.now();

    const data = JSON.parse(msg.data as string);
    const messages = Array.isArray(data) ? data : [data];

    let statusMessage: PolygonStatusMessage | undefined;

    messages.forEach((m) => {
      // Handle status messages
      if (isStatusMessage(m)) {
        console.log(`Status: ${m.status} - ${m.message || ""}`);

        if (m.status === "auth_success") {
          this.health.connected = true;
          this.state = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;

          // Resolve the auth promise to allow connect() to return
          if (this.authResolver) {
            this.authResolver();
            this.authResolver = null;
          }
        }

        // Check for subscription confirmation
        if (m.status === "success" && m.message?.includes("subscribed to:")) {
          // Resolve the subscribe promise
          if (this.subscribeResolver) {
            this.subscribeResolver();
            this.subscribeResolver = null;
          }
        }

        // Check for unsubscription confirmation
        if (m.status === "success" && m.message?.includes("unsubscribed to:")) {
          // Resolve the unsubscribe promise
          if (this.unsubscribeResolver) {
            this.unsubscribeResolver();
            this.unsubscribeResolver = null;
          }
        }

        statusMessage = m;
        return;
      }

      // Handle aggregate events (bars)
      if (isAggregateEvent(m)) {
        // Validate with Zod
        const validation = PolygonAggregateEventSchema.safeParse(m);
        if (!validation.success) {
          console.error("Invalid aggregate event:", validation.error);
          return;
        }

        const bar = aggregateToBar(m);
        flowStore.setBar(bar.symbol, bar);

        // Write to Redis (non-blocking, errors logged)
        redisStore.writeBar(bar).catch((err) => {
          console.error("Redis write failed:", err);
        });

        // Write to TimescaleDB (non-blocking)
        timescaleStore.insertBar(bar).catch((err) => {
          console.error("TimescaleDB write failed:", err);
        });

        return;
      }

      // Handle quote events (top of book)
      if (isQuoteEvent(m)) {
        console.log(
          `Quote: ${m.sym} - Bid: ${m.bp}x${m.bs}, Ask: ${m.ap}x${m.as}`
        );
        return;
      }

      // Handle trade events
      if (isTradeEvent(m)) {
        console.log(`Trade: ${m.sym} - Price: ${m.p}, Size: ${m.s}`);
        return;
      }

      // Unknown message type
      console.log("Unknown message type:", m);
    });

    return statusMessage;
  }

  async subscribe(request: PolygonWsRequest): Promise<void> {
    // Save subscription for reconnects (deduplicate)
    if (
      !this.subscriptions.find(
        (s) =>
          s.ev === request.ev &&
          JSON.stringify(s.symbols) === JSON.stringify(request.symbols)
      )
    ) {
      this.subscriptions.push(request);
    }

    const params = buildSubscribeParams(request);
    console.log("Subscribing to:", params);

    // Create a promise that resolves when subscription is confirmed
    const subscribePromise = new Promise<void>((resolve) => {
      this.subscribeResolver = resolve;
    });

    this.ws?.send(
      JSON.stringify({
        action: "subscribe",
        params,
      })
    );

    this.health.subscriptionCount = request.symbols.length;

    // Wait for subscription confirmation before returning
    await subscribePromise;
  }

  async unsubscribe(request: PolygonWsRequest): Promise<void> {
    if (!this.ws || this.state === ConnectionState.DISCONNECTED) {
      console.log("Cannot unsubscribe: not connected");
      // Still remove from local tracking
      this.subscriptions = this.subscriptions.filter(
        (s) =>
          !(
            s.ev === request.ev &&
            JSON.stringify(s.symbols) === JSON.stringify(request.symbols)
          )
      );
      return;
    }

    const params = buildSubscribeParams(request);
    console.log("Unsubscribing from:", params);

    // Create a promise that resolves when unsubscription is confirmed
    const unsubscribePromise = new Promise<void>((resolve) => {
      this.unsubscribeResolver = resolve;
    });

    this.ws.send(
      JSON.stringify({
        action: "unsubscribe",
        params,
      })
    );

    // Wait for unsubscription confirmation before removing from tracking
    await unsubscribePromise;

    // Remove from tracked subscriptions
    this.subscriptions = this.subscriptions.filter(
      (s) =>
        !(
          s.ev === request.ev &&
          JSON.stringify(s.symbols) === JSON.stringify(request.symbols)
        )
    );

    // Update subscription count
    this.health.subscriptionCount = this.subscriptions.reduce(
      (total, sub) => total + sub.symbols.length,
      0
    );
  }

  async updateSubscription(
    old: PolygonWsRequest,
    newRequest: PolygonWsRequest
  ): Promise<void> {
    const oldSymbols = old.symbols.sort().join(",");
    const newSymbols = newRequest.symbols.sort().join(",");

    if (oldSymbols === newSymbols && old.ev === newRequest.ev) {
      console.log("No subscription change needed - symbols unchanged");
      return;
    }

    console.log(
      `Updating subscription: ${old.symbols.length} symbols → ${newRequest.symbols.length} symbols`
    );

    // Unsubscribe from old
    await this.unsubscribe(old);

    // Subscribe to new with retry logic
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.subscribe(newRequest);
        console.log(`Subscription updated successfully`);
        return;
      } catch (err) {
        console.error(
          `Subscribe attempt ${attempt}/${maxRetries} failed:`,
          err
        );

        if (attempt === maxRetries) {
          throw new Error(
            `Failed to subscribe after ${maxRetries} attempts: ${err}`
          );
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await Bun.sleep(delay);
      }
    }
  }

  getSubscriptions(): PolygonWsRequest[] {
    return [...this.subscriptions];
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this.state = ConnectionState.DISCONNECTED;
  }

  async getHealth(): Promise<WSHealth> {
    await this.measureLatency();
    return { ...this.health };
  }

  private async measureLatency(): Promise<void> {
    try {
      const start = Date.now();

      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers?active=true&limit=1&apiKey=${POLYGON_API_KEY}`
      );

      if (response.ok) {
        const end = Date.now();
        this.health.latencyMs = end - start;
      } else {
        console.error("Latency check failed with status:", response.status);
        this.health.latencyMs = null;
      }
    } catch (err) {
      console.error("Failed to measure latency:", err);
      this.health.latencyMs = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.state === ConnectionState.RECONNECTING) {
      return;
    }

    if (
      this.state === ConnectionState.SUBSCRIBED ||
      this.state === ConnectionState.CONNECTED
    ) {
      return;
    }

    this.state = ConnectionState.RECONNECTING;

    const delay = Math.min(500 * Math.pow(2, this.reconnectAttempts), 20_000);

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.reconnect();
    }, delay);
  }

  private async reconnect(): Promise<void> {
    if (!this.market) {
      console.error("Cannot reconnect: market type not saved");
      return;
    }

    console.log("Attempting reconnect...");

    // Clean up old connection before creating new one
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    await this.connect(this.market);

    for (const sub of this.subscriptions) {
      await this.subscribe(sub);
    }
  }
}
