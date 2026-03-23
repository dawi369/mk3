# Provider Limitations

## Current State

The backend depends on Massive/Polygon futures APIs that are still evolving.

This affects:

- active-contract discovery quality
- snapshot coverage
- front-month confidence
- historical-data availability

## Observable Risks

- some products may have incomplete or inconsistent snapshot data
- open interest may be missing or delayed
- contract universes may not perfectly match expectations at all times
- beta coverage changes can alter behavior without backend code changes

## Backend Mitigations In Place

- active contracts are used as the candidate universe
- static month-code generation exists as a fallback for subscription building
- front-month resolution uses ranked fallbacks:
  - volume
  - open interest
  - nearest valid expiry
- front-month output includes `confidence`

## Operational Recommendation

When debugging missing sectors, products, or front months, inspect:

```bash
curl http://localhost:3001/contracts/active | jq
curl http://localhost:3001/front-months | jq
curl http://localhost:3001/snapshots | jq
```

This helps separate:

- provider-side missing data
- weak ranking signals
- stale cached metadata
- subscription-planning errors

## Deferred Work

- stronger provider-quality monitoring
- confidence downgrade rules based on sparse candidate sets
- explicit anomaly logging for missing expected products
