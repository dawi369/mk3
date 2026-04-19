# Data Layer

## Backend Contract

The frontend expects the backend hub to provide:

- `GET /symbols`
- `GET /snapshots`
- `GET /sessions`
- `GET /bars/range/:symbol`
- WebSocket market-data stream at the same base hub URL

## Bootstrap

On startup, the frontend loads:

1. front-mode symbols from `/symbols`
2. curve-mode symbols from local ticker metadata
3. snapshots from `/snapshots`
4. sessions from `/sessions`

That bootstrap is applied in one store operation so the UI does not depend on partial timing.

## Live Flow

WebSocket messages are parsed through a typed hub client.

Valid `market_data` messages are:
- buffered to the next animation frame
- ingested into the registry store in batches
- exposed to charts, cards, spotlight, and modal state

## Store

`useTickerStore` holds:

- `entitiesByMode`
- `seriesByMode`
- `byAssetClassByMode`
- `snapshotsBySymbol`
- `sessionsBySymbol`
- modal/chart/selection state

This is the authoritative client-side market registry.

## History

Chart history is loaded through a shared hub history client.

Current behavior:
- requests are keyed by `symbol + timeframe + range`
- identical requests are deduplicated
- short-lived responses are cached to reduce duplicate fetches when charts reopen or rerender
- sparse responses can fall back to lower timeframe data and resample client-side

## Testing

The frontend data layer has focused tests for:

- hub message parsing and reconnect behavior
- bootstrap loading
- store bootstrap + bar ingestion
- provider bootstrap/live flow
- history-request caching and dedupe
