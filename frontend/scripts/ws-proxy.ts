import { Redis } from "ioredis";
import { NEXT_PUBLIC_REDIS_HOST, NEXT_PUBLIC_REDIS_PORT } from "@/config/env.js";
import type { Server, ServerWebSocket } from "bun";

const WS_PORT = 3001;

console.log(`🚀 Starting WebSocket Proxy...`);
console.log(`🔌 Connecting to Redis at ${NEXT_PUBLIC_REDIS_HOST}:${NEXT_PUBLIC_REDIS_PORT}`);

const redis = new Redis({
  host: NEXT_PUBLIC_REDIS_HOST,
  port: parseInt(NEXT_PUBLIC_REDIS_PORT),
});

const server = Bun.serve({
  port: WS_PORT,
  fetch(req: Request, server: Server<unknown>) {
    if (server.upgrade(req, { data: undefined })) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    async open(ws: ServerWebSocket<unknown>) {
      console.log("Client connected");
      ws.subscribe("market_data");
      ws.send(JSON.stringify({ type: "info", message: "Connected to Market Data Stream" }));

      // Send recent history as snapshot (last 100 messages)
      try {
        const recentMessages = await redis.xrevrange("market_data", "+", "-", "COUNT", 100);

        for (const [id, fields] of recentMessages.reverse()) {
          const data: Record<string, any> = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }

          const payload = JSON.stringify({
            type: "market_data",
            id,
            data: data.data ? JSON.parse(data.data) : data,
            snapshot: true,
          });

          ws.send(payload);
        }

        console.log(`Sent ${recentMessages.length} snapshot messages to new client`);
      } catch (error) {
        console.error("Error sending snapshot:", error);
      }
    },
    message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
      // Handle incoming messages if needed (e.g. subscription requests)
    },
    close(ws: ServerWebSocket<unknown>) {
      console.log("Client disconnected");
    },
  },
});

console.log(`📡 WebSocket Server listening on ws://localhost:${WS_PORT}`);

// Redis Stream Consumer
async function consumeStream() {
  let lastId = "$"; // Start reading from new messages only (not historical)

  while (true) {
    try {
      // Block for 5 seconds waiting for new messages
      const streams = await redis.xread("BLOCK", 5000, "STREAMS", "market_data", lastId);

      if (streams) {
        const [streamName, messages] = streams[0];

        for (const [id, fields] of messages) {
          lastId = id;

          // Parse fields (array of strings: [key1, val1, key2, val2...])
          const data: Record<string, any> = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }

          // Broadcast to all connected clients
          const payload = JSON.stringify({
            type: "market_data",
            id,
            data: data.data ? JSON.parse(data.data) : data,
            snapshot: false,
          });

          server.publish("market_data", payload);
        }
      }
    } catch (error) {
      console.error("Error reading from Redis stream:", error);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retrying
    }
  }
}

// Start consumer
consumeStream();
