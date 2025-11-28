// Purpose: Test WebSocket client to verify Edge WS server functionality

import WebSocket from "ws";
import { delayTime } from "@/types/api.types.js";

const ws = new WebSocket("ws://localhost:3003");

ws.on("open", () => {
  console.log("✅ Connected to Edge WebSocket server");
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());
  console.log("📨 Received:", JSON.stringify(message, null, 2));

  // Test subscribe after welcome
  if (message.type === "welcome") {
    console.log("\n🔔 Subscribing to ESZ5 and NQZ5...");
    ws.send(
      JSON.stringify({
        action: "subscribe",
        symbols: ["ESZ5", "NQZ5"],
      })
    );
  }

  // Test set delay after subscription confirmation
  if (message.type === "subscribed") {
    console.log("\n⏱️  Setting 15-minute delay...");
    ws.send(
      JSON.stringify({
        action: "setDelay",
        delaySeconds: delayTime.fifteenMinutes,
      })
    );
  }

  // After delay is set, test bar reception
  if (message.type === "bar") {
    console.log(
      `\n📊 Bar received: ${message.data.symbol} @ ${message.data.close}`
    );
  }
});

ws.on("ping", () => {
  console.log("🏓 Ping received, sending pong");
});

ws.on("close", () => {
  console.log("❌ Disconnected from server");
  process.exit(0);
});

ws.on("error", (error) => {
  console.error("❌ WebSocket error:", error.message);
  process.exit(1);
});

// Keep alive for 30 seconds
setTimeout(() => {
  console.log("\n✅ Test complete, closing connection");
  ws.close();
}, 30000);
