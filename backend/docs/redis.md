# Redis Reference

Redis is the hot-path system of record for the active backend runtime.

## Purpose

Redis stores:

- latest bars
- recent time-series history
- broadcast stream payloads
- session metrics
- snapshot cache entries
- active-contract cache entries
- lightweight job and runtime metadata

## Keyspace

### Market Data

| Key | Type | Purpose |
|-----|------|---------|
| `bar:latest` | HASH | Latest normalized bar by symbol |
| `ts:bar:{tf}:{symbol}:{field}` | TIMESERIES | Redis time series per field and timeframe |
| `market_data` | STREAM | Real-time event stream for connected consumers |
| `bars` | PUB/SUB | Legacy compatibility channel |

### Session And Snapshot Data

| Key | Type | Purpose |
|-----|------|---------|
| `session:{symbol}:{sessionId}` | HASH | Session metrics for one symbol and one trading session |
| `snapshot:{symbol}` | HASH | Exchange/session snapshot for one symbol |

### Contract And Runtime Metadata

| Key | Type | Purpose |
|-----|------|---------|
| `contracts:active:{productCode}` | STRING(JSON) | Cached active contracts for a product root |
| `cache:front-months` | STRING(JSON) | Front-month resolution cache |
| `meta:subscribed_symbols` | STRING(JSON) | Persisted currently subscribed symbols |
| `meta:trading_date` | STRING | Last clear date |
| `meta:bar_count` | STRING | Bars processed since last clear |

### Job Status

| Key | Type | Purpose |
|-----|------|---------|
| `job:clear:status` | STRING(JSON) | Daily clear job status |
| `job:refresh:status` | STRING(JSON) | Subscription refresh job status |
| `job:front-months:status` | STRING(JSON) | Front-month job status |
| `job:snapshot:status` | STRING(JSON) | Snapshot job status |

## Retention

- `bar:latest`: cleared by manual forced reset
- `market_data`: cleared by manual forced reset
- `session:*`: retained across the hot window and pruned by maintenance
- `snapshot:*`: retained briefly and pruned by maintenance
- `ts:bar:*`: retained for 7 days
- `contracts:active:*`: retained until overwritten by newer metadata

## Session Metrics

Each `session:{symbol}:{sessionId}` hash maintains:

- `sessionId`
- `sessionStartTime`
- `sessionEndTime`
- `rootSymbol`
- `timezone`
- `dayOpen`
- `dayHigh`
- `dayLow`
- `vwap`
- `cvol`
- `tradeCount`
- `volNow`
- `volMin`
- `volMax`
- `volPos`
- `volBucket`
- `vwapMin`
- `vwapMax`
- `vwapPos`
- `vwapBucket`
- `cumPriceVolume`
- `cumVolume`
- `timestamp`

These metrics are computed incrementally from incoming bars and replayed recovery bars.

## Front-Month Support

Redis stores two separate pieces of front-month support data:

- `contracts:active:{productCode}`: candidate contract universe
- `cache:front-months`: resolved leader per product root

This separation matters operationally:

- contract discovery can succeed while front-month ranking is weak
- front-month ranking can be inspected independently of live subscriptions

## Maintenance Behavior

Automatic daily maintenance prunes stale session and snapshot hashes.
Manual forced clear still removes:

- `bar:latest`
- `market_data`
- `session:*`
- `snapshot:*`

It does not remove:

- Redis time-series history
- active-contract metadata
- front-month cache

## Operator Checks

```bash
curl http://localhost:3001/contracts/active | jq
curl http://localhost:3001/front-months | jq
curl http://localhost:3001/snapshots | jq
curl http://localhost:3001/sessions | jq
```

For open design gaps around sessions and provider quality, see [concerns/README.md](./concerns/README.md).
