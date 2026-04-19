# Frontend Architecture

## Stack

- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Zustand for client state
- Tailwind CSS 4
- lightweight-charts for chart rendering

## Main Runtime Shape

The frontend has one primary market-data path:

1. `ConnectionProvider`
   - owns the typed hub WebSocket client
2. `DataProvider`
   - loads bootstrap data from the backend
   - ingests live market-data messages into the store
3. `useTickerStore`
   - single source of truth for contracts, series, snapshots, sessions, and selection state
4. terminal hooks/components
   - derive view-ready state from the registry

## Provider Hierarchy

`RootProvider`
- `ThemeProvider`
- `AuthProvider`
- `ConnectionProvider`
- `DataProvider`
- page content

Terminal route providers:
- `TerminalViewProvider`
- `HeaderProvider`
- `SpotlightProvider`

## Current View Surface

Supported terminal views for beta:
- `terminal`
- `ai-lab` (coming soon)
- `backtesting` (coming soon)

Not part of the normal beta surface:
- `stream` (dev/debug only)

## Notes

- The old parallel market-data path has been removed.
- Front-month metadata is currently not part of the active terminal runtime.
- Market/session correctness depends on backend responses; the frontend should not invent prices.
