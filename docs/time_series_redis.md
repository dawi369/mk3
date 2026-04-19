# RedisTimeSeries Implementation Plan

## Summary
We will replace list-based history storage with RedisTimeSeries (RTS) for all 1-second bars, keep 7 days of retention, and auto-downsample into the UI timeframes (15s, 30s, 1m, 5m, 15m, 30m, 1h, 2h, 4h, 1d). The Redis stream remains for real-time WebSocket fanout. TimescaleDB continues to store long-term history.

## Architecture
- Ingest: WebSocket -> normalize bar -> RedisTimeSeries (1s) + RTS downsample rules
- Stream: Redis `market_data` stream remains for real-time broadcast
- Query: REST endpoints use `TS.MRANGE` to return candles in the requested timeframe
- Retention: RTS retains 7 days; no daily deletes of RTS keys

## Key Schema
Key format:
`ts:bar:{tf}:{symbol}:{field}`

Examples:
- `ts:bar:1s:ESH6:open`
- `ts:bar:1m:ESH6:close`

Labels:
- `symbol=ESH6`
- `product=ES`
- `field=open|high|low|close|volume|trades`
- `tf=1s|15s|30s|1m|5m|15m|30m|1h|2h|4h|1d`

Retention:
- All RTS series use 7 days retention (`RETENTION 604800000`)

## Downsampling Rules
Rules are created per symbol per field:
- 1s -> 15s
- 1s -> 30s
- 1s -> 1m
- 1m -> 5m
- 1m -> 15m
- 1m -> 30m
- 1m -> 1h
- 1h -> 2h
- 1h -> 4h
- 1h -> 1d

Aggregations per field:
- open: FIRST
- high: MAX
- low: MIN
- close: LAST
- volume: SUM
- trades: SUM

## Ingest Flow
On first bar for a symbol:
1. Create RTS series for all fields/timeframes (idempotent)
2. Create downsample rules (idempotent)

On every bar:
1. `TS.MADD` for open/high/low/close/volume/trades at timestamp
2. `HSET bar:latest` for latest lookup
3. `XADD market_data` for WS broadcast
4. Update session hash (VWAP, CVOL, etc)

## Query Endpoints
- `GET /bars/range/:symbol?start=ms&end=ms&tf=1m`
- `GET /bars/week/:symbol?tf=1m`
- `GET /bars/today/:symbol?tf=1s`

All range endpoints use `TS.MRANGE` with `symbol` + `tf` label filters and merge field series into OHLCV candles.

## Frontend Changes
When the chart modal opens or the timeframe changes:
1. Fetch `/bars/week/:symbol?tf=${timeframe}` for primary + comparisons
2. Hydrate the store with historical bars
3. Live WS updates continue to append

## Docker Compose Change
Redis must be Redis Stack to enable RedisTimeSeries:

```yaml
redis:
  image: redis/redis-stack-server:latest
  container_name: mk3-redis
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  command: redis-stack-server --appendonly yes
```

Verify RTS module:
`redis-cli MODULE LIST`

## Curve Mode Readiness
Because RTS uses labels, curve queries become trivial:
- Latest curve: `TS.MGET FILTER product=ES tf=1s field=close`
- Historical curve: `TS.MRANGE start end FILTER product=ES tf=1m field=close`

This supports term structure without additional indexing.

## Rollout Checklist
1. Switch Redis image to Redis Stack
2. Add RTS series + rules on ingest
3. Add range/week endpoints
4. Update frontend to hydrate history
5. Validate charts across timeframes
