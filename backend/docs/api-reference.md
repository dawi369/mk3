# API Reference

## Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Minimal service health status |
| `/bars/session/:symbol` | GET | Bars for the trading session containing `ts` or now |
| `/bars/today/:symbol` | GET | Alias for current trading-session bars |
| `/bars/range/:symbol` | GET | Arbitrary Redis time-series range |
| `/symbols` | GET | Symbols present in `bar:latest` |
| `/sessions` | GET | All session metrics |
| `/snapshots` | GET | All snapshot cache entries |

## Query Parameters

### `/bars/range/:symbol`

| Param | Required | Description |
|-------|----------|-------------|
| `start` | Yes | Start timestamp in ms |
| `end` | Yes | End timestamp in ms |
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

## Supported Timeframes

`1s`, `15s`, `30s`, `1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `1d`

## Admin Endpoints

These require one of:

- `X-API-Key: $HUB_API_KEY`
- `Authorization: Bearer $HUB_API_KEY`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/subscriptions` | GET | Current upstream WS subscriptions |
| `/admin/health` | GET | Detailed operator health and job state |
| `/admin/recovery/checkpoints` | GET | Recovery checkpoint state for operator inspection |
| `/admin/front-months` | GET | Resolved front months by product |
| `/admin/contracts/active` | GET | Cached active contracts by product root |
| `/admin/contracts/active/:productCode` | GET | Cached active contracts for one product root |
| `/admin/bars/latest` | GET | Latest bar for all subscribed symbols |
| `/admin/bars/latest/:symbol` | GET | Latest bar for a single symbol |
| `/admin/bars/week/:symbol` | GET | Last 7 days from Redis time series |
| `/admin/refresh-subscriptions` | POST | Rebuild subscriptions from current active contracts |
| `/admin/refresh-front-months` | POST | Rebuild front-month cache |
| `/admin/refresh-snapshots` | POST | Refresh per-symbol snapshot cache |
| `/admin/clear-redis` | POST | Clear intraday Redis hot data |

## Example Calls

```bash
curl http://localhost:3001/health | jq
curl "http://localhost:3001/bars/session/ESM6?tf=1m" | jq
curl "http://localhost:3001/bars/range/ESH6?tf=1m&start=1710000000000&end=1710086400000" | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/subscriptions | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/health | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/contracts/active/ES | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/front-months | jq
curl -H "X-API-Key: $HUB_API_KEY" http://localhost:3001/admin/recovery/checkpoints | jq
```
