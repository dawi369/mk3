# Historical Data Concerns

## Current State

- Redis time series provides only short-window hot history.
- TimescaleDB exists in code but is intentionally not part of the active runtime.
- Futures flat-file or equivalent historical access is not yet in place for the current provider workflow.

## Deferred Features

These depend on longer-window historical storage:

| Feature | Window |
|---------|--------|
| 52-week high/low | 1 year |
| Average volume | 5-day / 20-day |
| ATR | 14-day typical |
| Historical VWAP | variable |
| broader backtesting datasets | multi-week / multi-month |

## Planned Direction

When historical access is mature enough:

1. ingest longer-window bar history into a dedicated historical store
2. compute slow analytics out of band
3. cache derived values in Redis
4. expose them through separate endpoints

## Recommendation

Do not let paused historical storage distort the hot-path runtime. Keep the current backend Redis-first until the provider-side data story is strong enough to justify turning historical persistence back on.
