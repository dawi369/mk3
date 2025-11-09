# Testing Redis Pub/Sub

## Quick Test

### Start Hub
```bash
cd /home/david/dev/mk3/backend
npx tsx src/servers/hub/index.ts
```

### Subscribe to Bar Channel

In another terminal:
```bash
docker exec -it mk3-redis-1 redis-cli
```

Then in Redis CLI:
```
SUBSCRIBE bars
```

You should see messages like:
```
1) "subscribe"
2) "bars"
3) (integer) 1

1) "message"
2) "bars"
3) "{\"symbol\":\"ESZ25\",\"timestamp\":1699564800000,\"open\":4500.0,\"high\":4501.5,\"low\":4499.0,\"close\":4500.5,\"volume\":1234}"
```

### Verify Data Flow

Each time a bar arrives from Polygon, you'll see:
- Console log in Hub: "Subscribing to: A.ESZ25..."
- Redis pub/sub message with full bar data

If markets are closed (weekends, 5pm-6pm ET), you won't see live data.

## Edge Server Implementation (Future)

Edge will use:
```typescript
// Subscribe to Redis channel
redis.subscribe('bars', (err, count) => {
  console.log(`Subscribed to ${count} channel(s)`);
});

// Handle incoming bars
redis.on('message', (channel, message) => {
  if (channel === 'bars') {
    const bar = JSON.parse(message);
    // Process and broadcast to frontend clients
  }
});

// On startup, get today's snapshot
const symbols = await redis.keys('bar:today:*');
for (const key of symbols) {
  const bars = await redis.lrange(key, 0, -1);
  // Load into Edge cache
}
```

## Notes

- Hub publishes to single channel `bars` (all symbols)
- Edge receives all bars, filters if needed
- Message format: JSON-serialized Bar object
- No acknowledgment required (fire and forget)

