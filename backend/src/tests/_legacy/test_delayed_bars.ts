// Purpose: Test delayed bar streaming from Edge WS server

import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3003");
let barCount = 0;

ws.on("open", () => {
  console.log("✅ Connected to Edge WebSocket server");
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());
  
  // Test subscribe after welcome
  if (message.type === "welcome") {
    console.log("📨 Welcome received");
    console.log("🔔 Subscribing to all symbols...");
    ws.send(
      JSON.stringify({
        action: "subscribe",
        symbols: ["*"],
      })
    );
  }

  // Test set delay after subscription confirmation
  if (message.type === "subscribed") {
    console.log("✅ Subscribed to all symbols");
    console.log("⏱️  Setting 30-second delay...");
    ws.send(
      JSON.stringify({
        action: "setDelay",
        delaySeconds: 30, // 30 seconds delay for testing
      })
    );
  }

  // After delay is set
  if (message.type === "delaySet") {
    console.log(`✅ Delay set to ${message.delaySeconds} seconds`);
    console.log("⏳ Waiting for delayed bars...\n");
  }

  // Log bars as they arrive
  if (message.type === "bar") {
    barCount++;
    const bar = message.data;
    const timestamp = new Date(bar.endTime).toLocaleTimeString();
    console.log(
      `📊 [${barCount}] ${bar.symbol} @ ${bar.close} | Time: ${timestamp}`
    );
  }

  // Handle pong
  if (message.type === "pong") {
    // Silently handle pong
  }
});

ws.on("ping", () => {
  // Server sent ping, ws library auto-responds with pong
});

ws.on("close", () => {
  console.log(`\n❌ Disconnected from server. Total bars received: ${barCount}`);
  process.exit(0);
});

ws.on("error", (error) => {
  console.error("❌ WebSocket error:", error.message);
  process.exit(1);
});

// Keep alive for 2 minutes to receive delayed bars
setTimeout(() => {
  console.log(`\n✅ Test complete. Total bars received: ${barCount}`);
  ws.close();
}, 120000); // 2 minutes

