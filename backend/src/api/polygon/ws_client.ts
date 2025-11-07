import { websocketClient } from "@polygon.io/client-js";
import { POLYGON_API_KEY } from "@/config/env.js";
import { POLYGON_WS_URL } from "@/utils/consts.js";
import type { PolygonWsRequest, PolygonMarketType, PolygonStatusMessage } from "@/utils/types.js";
import {
  buildSubscribeParams,
  isAggregateEvent,
  isStatusMessage,
  isQuoteEvent,
  isTradeEvent,
  aggregateToBar,
} from "@/utils/types.js";
import { flowStore } from "@/data/flow_store.js";


// Health status type
interface WSHealth {
  connected: boolean;
  lastMessageTime: number | null;
  subscriptionCount: number;
  latencyMs: number | null;
}

export class PolygonWSClient {
  private ws: any = null;
  private health: WSHealth = {
    connected: false,
    lastMessageTime: null,
    subscriptionCount: 0,
    latencyMs: null,
  };
  private authResolver: (() => void) | null = null;
  private subscribeResolver: (() => void) | null = null;

  async connect(marketType: PolygonMarketType): Promise<void> {
    console.log(`Connecting to Polygon ${marketType}...`);

    const client = websocketClient(POLYGON_API_KEY, POLYGON_WS_URL);

    // Select the appropriate market type connection
    switch (marketType) {
      case "futures":
        this.ws = client.futures();
        break;
      case "stocks":
        this.ws = client.stocks();
        break;
      case "crypto":
        this.ws = client.crypto();
        break;
      default:
        throw new Error(`Unsupported market type: ${marketType}`);
    }

    // Create a promise that resolves when authenticated
    const authPromise = new Promise<void>((resolve) => {
      this.authResolver = resolve;
    });

    this.ws.onmessage = (msg: MessageEvent) => {
      const statusMessage = this.handleMessage(msg);
      if (statusMessage) {
        // console.log("Connect status message:", statusMessage);
      }
    };

    this.ws.onerror = (err: unknown) => {
      console.error("WebSocket error:", err);
      this.health.connected = false;
    };

    this.ws.onclose = (code: number, reason: string) => {
      console.log("Connection closed", code, reason);
      this.health.connected = false;
    };

    // Wait for authentication before returning
    await authPromise;
  }

  private handleMessage(msg: MessageEvent): PolygonStatusMessage | void {
    this.health.lastMessageTime = Date.now();

    const data = JSON.parse(msg.data);
    const messages = Array.isArray(data) ? data : [data];

    let statusMessage: PolygonStatusMessage | undefined;

    messages.forEach((m) => {
      // Handle status messages
      if (isStatusMessage(m)) {
        console.log(`Status: ${m.status} - ${m.message || ""}`);

        if (m.status === "auth_success") {
          this.health.connected = true;
        //   console.log("Connected");
          
          // Resolve the auth promise to allow connect() to return
          if (this.authResolver) {
            this.authResolver();
            this.authResolver = null;
          }
        }

        // Check for subscription confirmation
        if (m.status === "success" && m.message?.includes("subscribed to:")) {
        //   console.log("Subscription confirmed");
          
          // Resolve the subscribe promise
          if (this.subscribeResolver) {
            this.subscribeResolver();
            this.subscribeResolver = null;
          }
        }
        
        statusMessage = m;
        return;
      }

      // Handle aggregate events (bars)
      if (isAggregateEvent(m)) {
        const bar = aggregateToBar(m);
        flowStore.setBar(bar.symbol, bar);
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
    const params = buildSubscribeParams(request);
    console.log("Subscribing to:", params);

    // Create a promise that resolves when subscription is confirmed
    const subscribePromise = new Promise<void>((resolve) => {
      this.subscribeResolver = resolve;
    });

    this.ws.send(
      JSON.stringify({
        action: "subscribe",
        params,
      })
    );

    this.health.subscriptionCount = request.symbols.length;

    // Wait for subscription confirmation before returning
    await subscribePromise;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
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

      //   const response = await fetch(`https://massive.com/`);
      //   if (response.ok || response.status === 301 || response.status === 302) {
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
}
