# Frontend Architecture

> **Swordfish** — Futures trading terminal with real-time market data

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4, HSL design tokens |
| UI Components | shadcn/ui (Radix primitives) |
| State | Zustand |
| Real-time | WebSocket |
| Animation | Framer Motion |
| Charts | lightweight-charts |

---

## Project Structure

```
frontend/src/
├── app/                         # Next.js App Router
│   ├── (features)/              # Protected features
│   │   └── terminal/            # Main trading terminal
│   ├── (homeAmarketing)/        # Marketing pages
│   └── layout.tsx               # Root layout
│
├── components/
│   ├── ui/                      # shadcn components (60+)
│   ├── terminal/                # Terminal-specific
│   │   ├── layout/              # Dock, header, spotlight
│   │   ├── views/               # Terminal, sentiment, AI lab
│   │   └── ticker-modal/        # Detail modals
│   └── common/                  # ErrorBoundary, GlobalBackground
│
├── providers/                   # React Context
│   ├── root-provider.tsx        # Top-level composition
│   ├── connection-provider.tsx  # WebSocket management
│   ├── data-provider.tsx        # Market data sync
│   └── front-month-provider.tsx # Futures contract logic
│
├── store/                       # Zustand stores
│   ├── use-market-store.ts      # Live market data
│   └── use-ui-store.ts          # UI state
│
├── hooks/
│   ├── use-terminal-data.ts     # Data transformation
│   └── use-throttled-value.ts   # Performance throttling
│
├── lib/
│   └── ticker-mapping.ts        # Asset class organization
│
├── types/
│   ├── common.types.ts          # Bar, FuturesInstrument
│   └── api.types.ts             # WebSocket messages
│
└── styles/globals.css           # Tailwind + design tokens
```

---

## Provider Hierarchy

```
RootLayout
└── RootProvider
    └── ThemeProvider
        └── AuthProvider
            └── ConnectionProvider (WebSocket)
                └── DataProvider (syncs to Zustand)
                    └── GlobalBackground
                        └── Page Content
```

**Terminal-specific** (scoped to `/terminal` route):
```
FrontMonthProvider
└── TerminalViewProvider
    └── HeaderProvider
        └── SpotlightProvider
            └── TickerModalProvider
                └── Terminal Content
```

---

## Data Flow

```
Hub Server (Backend)
    │
    ▼ WebSocket
ConnectionProvider
    │
    ▼ subscribe()
DataProvider
    │
    ▼ handleMarketUpdate()
useMarketStore (Zustand)
    │
    ▼ state subscription
useTerminalData hook
    │
    ▼ transforms by asset class, throttles 100ms
TerminalCard components
```

### Key Types

```typescript
interface Bar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  startTime: number;  // ms epoch
  endTime: number;
}
```

---

## Indicators

> [!NOTE]
> Indicators are read from Redis via backend REST endpoints. Backend populates Redis; frontend reads only.

> [!CAUTION]
> **Beta Limitations:** Depth of book and options on futures are NOT available from Polygon. Do not implement.

### Price Reference

| Indicator | Description | Redis Source | Status |
|-----------|-------------|--------------|--------|
| **Last Price** | Current/latest trade price | `bar:latest` (WS) | ✅ Live |
| **Previous Close** | Last session close | `snapshot:{symbol}` | 🔲 Planned |
| **Previous Settlement** | Official prev settlement | `snapshot:{symbol}` | 🔲 Planned |
| **Day Open** | First bar of current session | `session:{symbol}` | 🔲 Planned |
| **Day High** | Session high (rolling) | `session:{symbol}` | 🔲 Planned |
| **Day Low** | Session low (rolling) | `session:{symbol}` | 🔲 Planned |
| **Settlement** | Official settlement price | `snapshot:{symbol}` | 🔲 Planned |

### Change Metrics

| Indicator | Description | Calculation | Status |
|-----------|-------------|-------------|--------|
| **Change ($)** | Dollar change from prev settlement | `last - prevSettlement` | 🔲 Planned |
| **Change (%)** | Percent change | `(last - prevSettlement) / prevSettlement * 100` | 🔲 Planned |
| **Range %** | Session volatility | `(high - low) / prevSettlement * 100` | 🔲 Planned |

### Volume & Liquidity

| Indicator | Description | Redis Source | Status |
|-----------|-------------|--------------|--------|
| **VWAP** | Volume-Weighted Average Price | `session:{symbol}.vwap` | 🔲 Planned |
| **CVOL** | Cumulative session volume | `session:{symbol}.cvol` | 🔲 Planned |
| **Open Interest (OI)** | Outstanding contracts | `snapshot:{symbol}.openInterest` | 🔲 Planned |
| **OI Change** | Δ OI from previous day | Computed client-side | 🔲 Planned |

### Contract-Specific

| Indicator | Description | Redis Source | Status |
|-----------|-------------|--------------|--------|
| **DTE** | Days to expiry | `cache:front-months` | ✅ Live |
| **Front Month** | Most liquid contract | `cache:front-months` | ✅ Live |
| **Is Rolling** | Volume migrating to next contract | `cache:front-months` | ✅ Live |
| **Product Code** | Root symbol (ES, NQ, etc.) | `snapshot:{symbol}` | 🔲 Planned |

### Priority (Implementation Order)

1. **P0 (Core):** Change $, Change %, VWAP, CVOL, Day High/Low
2. **P1 (Important):** Open Interest, Settlement, Range %
3. **P2 (Later):** OI Change, Product Code

---

## Terminal Views

The terminal has 3 switchable views via bottom dock:

| View | Component | Purpose |
|------|-----------|---------|
| Terminal | `TerminalView` | Asset class cards with market movers |
| Sentiment | `SentimentView` | Market sentiment analysis |
| AI Lab | `AiLabView` | AI-powered insights |

View transitions use Framer Motion `AnimatePresence`.

---

## Asset Classes

Defined in `lib/ticker-mapping.ts` with JSON configs in `tickers/`:

- US Indices
- Metals
- Grains
- Currencies
- Volatiles
- Softs

---

## Environment Variables

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3010
NEXT_PUBLIC_HUB_URL=http://localhost:3020
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Development

```bash
bun install
bun run dev          # http://localhost:3010
bun run build
bun run start
```

---

*Last updated: January 2026*
