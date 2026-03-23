# Session Model Concerns

## Current State

The backend currently uses a global daily reset strategy for hot intraday state.

That is operationally simple, but futures sessions are not globally uniform.

## Why This Matters

Different products and venues have different:

- session start/end times
- maintenance breaks
- holiday schedules
- roll and settlement behavior

As a result, these values are only approximations today:

- `session:{symbol}`
- intraday VWAP
- cumulative volume
- day high/low
- "today" bar ranges

## Known Product Families

- CME Globex style products
- CBOT grains with split-session behavior
- ICE products with different schedules

## Deferred Work

- define schedule metadata per product root
- anchor resets to exchange/product session boundaries
- support maintenance windows and split sessions
- support holiday calendars

## Recommendation

Treat the current session layer as useful intraday telemetry, not exact exchange-session accounting.
