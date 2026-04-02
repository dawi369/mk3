# API Reference

## Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health and job status |
| `/bars/latest` | GET | Latest bar for all subscribed symbols |
| `/bars/latest/:symbol` | GET | Latest bar for a single symbol |
| `/bars/session/:symbol` | GET | Bars for the trading session containing `ts` or now |
| `/bars/today/:symbol` | GET | Alias for current trading-session bars |
| `/bars/week/:symbol` | GET | Last 7 days from Redis time series |
| `/bars/range/:symbol` | GET | Arbitrary Redis time-series range |
| `/symbols` | GET | Symbols present in `bar:latest` |
| `/front-months` | GET | Resolved front months by product |
| `/contracts/active` | GET | Cached active contracts by product root |
| `/contracts/active/:productCode` | GET | Cached active contracts for one product root |
| `/sessions` | GET | All session metrics |
| `/sessions/week/:symbol` | GET | Session-history buckets over the retained Redis window |
| `/session/:symbol` | GET | Session metrics for the trading session containing `ts` or now |
| `/snapshots` | GET | All snapshot cache entries |
| `/snapshot/:symbol` | GET | Snapshot cache entry for one symbol |

## Query Parameters

### `/bars/range/:symbol`

| Param | Required | Description |
|-------|----------|-------------|
| `start` | Yes | Start timestamp in ms |
| `end` | Yes | End timestamp in ms |
| `tf` | No | Timeframe, default `1m` |

### `/bars/week/:symbol`

| Param | Required | Description |
|-------|----------|-------------|
| `tf` | No | Timeframe, default `1m` |

### `/bars/session/:symbol`

| Param | Required | Description |
|-------|----------|-------------|
| `tf` | No | Timeframe, default `1s` |
| `ts` | No | Timestamp in ms used to select the trading session |

### `/bars/today/:symbol`

`/bars/today/:symbol` is retained as a compatibility alias.
For futures, "today" means the current trading session, not calendar day.

| Param | Required | Description |
|-------|----------|-------------|
| `tf` | No | Timeframe, default `1s` |

### `/session/:symbol`

| Param | Required | Description |
|-------|----------|-------------|
| `ts` | No | Timestamp in ms used to select the trading session |

### `/sessions/week/:symbol`

| Param | Required | Description |
|-------|----------|-------------|
| `start` | No | Range start timestamp in ms, default `now - 7d` |
| `end` | No | Range end timestamp in ms, default `now` |

## Supported Timeframes

`1s`, `15s`, `30s`, `1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `1d`

## Admin Endpoints

These require one of:

- `X-API-Key: $HUB_API_KEY`
- `Authorization: Bearer $HUB_API_KEY`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/subscriptions` | GET | Current upstream WS subscriptions |
| `/admin/recovery/checkpoints` | GET | Recovery checkpoint state for operator inspection |
| `/admin/refresh-subscriptions` | POST | Rebuild subscriptions from current active contracts |
| `/admin/refresh-front-months` | POST | Rebuild front-month cache |
| `/admin/refresh-snapshots` | POST | Refresh per-symbol snapshot cache |
| `/admin/clear-redis` | POST | Clear intraday Redis hot data |

## Example Calls

```bash
curl http://localhost:3001/health | jq
curl http://localhost:3001/contracts/active/ES | jq
curl http://localhost:3001/front-months | jq
curl "http://localhost:3001/bars/session/ESM6?tf=1m" | jq
curl "http://localhost:3001/sessions/week/ESM6" | jq
curl "http://localhost:3001/bars/range/ESH6?tf=1m&start=1710000000000&end=1710086400000" | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/subscriptions | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/recovery/checkpoints | jq
```
