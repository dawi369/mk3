// Test WebSocket client to verify connection and data reception

const WS_URL = "ws://localhost:3000";

console.log(`🔌 Connecting to ${WS_URL}...`);

const ws = new WebSocket(WS_URL);

ws.onopen = () => {
  console.log("✅ Connected to WebSocket server");
};

ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    console.log("📨 Received message:", {
      type: message.type,
      snapshot: message.snapshot,
      id: message.id,
      data: message.data,
    });
  } catch (error) {
    console.error("❌ Failed to parse message:", error);
    console.log("Raw message:", event.data);
  }
};

ws.onerror = (error) => {
  console.error("❌ WebSocket error:", error);
};

ws.onclose = () => {
  console.log("🔌 Disconnected from WebSocket server");
  process.exit(0);
};

// Keep process alive for 10 seconds to receive messages
setTimeout(() => {
  console.log("⏱️ Test complete, closing connection");
  ws.close();
}, 10000);
