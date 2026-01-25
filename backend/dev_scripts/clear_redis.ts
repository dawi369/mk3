#!/usr/bin/env bun
/**
 * Clear all Redis data via the admin endpoint
 *
 * Usage: bun run scripts/clear_redis.ts
 *
 * Requires HUB_API_KEY and HUB_PORT in .env
 */

const HUB_PORT = Bun.env.HUB_PORT || "3001";
const HUB_API_KEY = Bun.env.HUB_API_KEY;

if (!HUB_API_KEY) {
  console.error("❌ HUB_API_KEY not set in .env");
  process.exit(1);
}

const url = `http://localhost:${HUB_PORT}/admin/clear-redis`;

async function clearRedis() {
  console.log(`🧹 Clearing Redis via ${url}...\n`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-Key": HUB_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
      console.error(text);
      process.exit(1);
    }

    const data = await response.json();
    console.log("✅ Redis cleared successfully!\n");
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Failed to connect to server:");
    console.error(err instanceof Error ? err.message : err);
    console.error("\nMake sure the backend is running: bun run dev");
    process.exit(1);
  }
}

clearRedis();
