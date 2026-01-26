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
