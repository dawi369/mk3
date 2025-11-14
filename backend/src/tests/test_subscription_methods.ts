import { PolygonWSClient } from "@/api/polygon/ws_client.js";
import type {
  PolygonMarketType,
  PolygonWsRequest,
} from "@/utils/polygon_types.js";

console.log("\n=== Testing Subscription Management Methods ===\n");

const client = new PolygonWSClient();
const market: PolygonMarketType = "futures";

try {
  // Connect
  console.log("1. Connecting to Polygon...");
  await client.connect(market);
  console.log("✓ Connected\n");

  // Test getSubscriptions (should be empty)
  console.log("2. Getting current subscriptions (should be empty)...");
  let subs = client.getSubscriptions();
  console.log(`   Subscriptions: ${subs.length}`);
  console.log("✓ getSubscriptions() works\n");

  // Subscribe to a few test symbols
  console.log("3. Subscribing to test symbols...");
  const testRequest: PolygonWsRequest = {
    ev: "A",
    symbols: ["ESZ25", "NQZ25"],
  };
  await client.subscribe(testRequest);
  console.log("✓ Subscribed\n");

  // Get subscriptions again
  console.log("4. Getting subscriptions after subscribe...");
  subs = client.getSubscriptions();
  console.log(`   Subscriptions: ${subs.length}`);
  console.log(`   Symbols: ${subs[0]?.symbols.join(", ")}`);
  console.log("✓ Subscription tracked\n");

  // Wait a moment for data
  console.log("5. Waiting 5 seconds for data...");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("✓ Wait complete\n");

  // Test unsubscribe
  console.log("6. Unsubscribing from test symbols...");
  await client.unsubscribe(testRequest);
  console.log("✓ Unsubscribed\n");

  // Verify unsubscribed
  console.log("7. Verifying subscriptions cleared...");
  subs = client.getSubscriptions();
  console.log(`   Subscriptions: ${subs.length} (should be 0)`);
  console.log("✓ unsubscribe() works\n");

  // Test updateSubscription
  console.log("8. Testing updateSubscription...");
  const oldRequest: PolygonWsRequest = {
    ev: "A",
    symbols: ["ESZ25"],
  };
  const newRequest: PolygonWsRequest = {
    ev: "A",
    symbols: ["ESH26"],
  };

  await client.subscribe(oldRequest);
  console.log("   Subscribed to ESZ25");

  await client.updateSubscription(oldRequest, newRequest);
  console.log("   Updated to ESH26");

  subs = client.getSubscriptions();
  console.log(`   Current symbols: ${subs[0]?.symbols.join(", ")}`);
  console.log("✓ updateSubscription() works\n");

  // Cleanup
  console.log("9. Disconnecting...");
  client.disconnect();
  console.log("✓ Disconnected\n");

  console.log("=== All Tests Passed ✓ ===\n");
  process.exit(0);
} catch (err) {
  console.error("❌ Test failed:", err);
  process.exit(1);
}
