# Frontend Architecture

**Last Updated:** November 15, 2025  
**Status:** Planning Phase 🔄

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Data Flow](#data-flow)
4. [Component Hierarchy](#component-hierarchy)
5. [State Management](#state-management)
6. [Edge Server Integration](#edge-server-integration)
7. [Chart Architecture](#chart-architecture)
8. [Future Extensions](#future-extensions)

---

## System Overview

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         User Browser                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   Next.js Application                   │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │  Dashboard  │  │   Sentiment  │  │   Indicators   │  │  │
│  │  │   Section   │  │    Section   │  │    Section     │  │  │
│  │  └──────┬──────┘  └──────┬───────┘  └────────┬───────┘  │  │
│  │         │                │                   │          │  │
│  │         └────────────────┼───────────────────┘          │  │
│  │                          │                              │  │
│  │                ┌─────────▼──────────┐                   │  │
│  │                │  Zustand Stores    │                   │  │
│  │                └─────────┬──────────┘                   │  │
│  │                          │                              │  │
│  │         ┌────────────────┼──────────────┐               │  │
│  │         │                │              │               │  │
│  │    ┌────▼─────┐    ┌────▼────┐    ┌─────▼─────┐         │  │
│  │    │   REST   │    │   WS    │    │   Chart   │         │  │
│  │    │  Client  │    │ Client  │    │  Manager  │         │  │
│  │    └────┬─────┘    └────┬────┘    └───────────┘         │  │
│  └─────────┼───────────────┼───────────────────────────────┘  │
│            │               │                                  │
└────────────┼───────────────┼──────────────────────────────────┘
             │               │
             │               │ WebSocket (port 3021)
             │ HTTP          │ Real-time bars
             │ (port 3020)   │
             │               │
     ┌───────▼───────────────▼────────┐
     │       Edge Server              │
     │  - REST API                    │
     │  - WebSocket Server            │
     │  - Bar Cache                   │
     └────────────┬───────────────────┘
                  │
          ┌───────▼────────┐
          │  Redis Pub/Sub │
          └───────┬────────┘
                  │
          ┌───────▼────────┐
          │   Hub Server   │
          │  (Polygon WS)  │
          └────────────────┘
```

---

## Architecture Layers

### Layer 1: UI Components (Presentation)

**Responsibility:** Display data, handle user interactions

**Components:**
- **Feature Components** - `features/dashboard/`, `features/sentiment/`, `features/indicators/`
- **Shared Components** - `components/ui/`, `components/charts/`, `components/layout/`
- **Pages** - `app/main/page.tsx`

**Key Principles:**
- Components receive data via props or hooks
- No direct API calls (use stores)
- Minimal business logic
- Optimized for performance (React.memo where needed)

---

### Layer 2: State Management (Business Logic)

**Responsibility:** Manage application state, coordinate data flow

**Stores (Zustand):**

1. **Dashboard Store** (`lib/stores/dashboard-store.ts`)
   - Latest bars for all symbols
   - Contract metadata
   - Selected contracts
   - Asset class groupings

2. **Sentiment Store** (`lib/stores/sentiment-store.ts`)
   - Volume metrics
   - Market breadth
   - Volatility calculations
   - Sentiment scores

3. **Indicators Store** (`lib/stores/indicators-store.ts`)
   - Technical indicator values (RSI, MACD, etc.)
   - Indicator settings
   - Historical calculations

4. **Connection Store** (`lib/stores/connection-store.ts`)
   - WebSocket connection state
   - Edge server health
   - Reconnection logic

5. **UI Store** (`lib/stores/ui-store.ts`)
   - Theme (dark/light)
   - Sidebar state
   - User preferences
   - Keyboard shortcuts state

**Why Zustand?**
- Simple, minimal API (like backend's clean patterns)
- No boilerplate
- React hooks integration
- Easy to test
- Small bundle size

---

### Layer 3: Data Layer (API Integration)

**Responsibility:** Communicate with Edge server, manage connections

#### REST Client (`lib/api/edge-client.ts`)

**Purpose:** Initial data loading, configuration queries

```typescript
class EdgeClient {
  // Health & monitoring
  getHealth(): Promise<HealthResponse>
  
  // Symbol & contract queries
  getSymbols(): Promise<string[]>
  getSymbolsGrouped(): Promise<GroupedSymbols>
  getContracts(root: string): Promise<ContractGroup>
  
  // Bar queries
  getLatestBars(): Promise<BarMap>
  getLatestBar(symbol: string): Promise<Bar | null>
  getBarHistory(symbol: string, limit?: number): Promise<Bar[]>
}
```

**Usage:**
- On app load: Fetch latest bars, symbols, contracts
- Periodic health checks
- Historical data for charts
- Contract metadata

---

#### WebSocket Client (`lib/api/websocket-client.ts`)

**Purpose:** Real-time bar streaming

```typescript
class EdgeWSClient {
  // Connection management
  connect(): Promise<void>
  disconnect(): void
  
  // Subscription management
  subscribe(symbols: string[]): void
  unsubscribe(symbols: string[]): void
  setDelay(seconds: number): void
  
  // Event handlers
  onBar(callback: (bar: Bar) => void): void
  onStatus(callback: (status: ConnectionStatus) => void): void
  onError(callback: (error: Error) => void): void
}
```

**Message Protocol** (matches Edge server):

**Client → Server:**
```json
// Subscribe to symbols
{ "action": "subscribe", "symbols": ["ESZ25", "NQZ25"] }

// Subscribe to all
{ "action": "subscribe", "symbols": ["*"] }

// Unsubscribe
{ "action": "unsubscribe", "symbols": ["ESZ25"] }

// Set delay (for demo/testing)
{ "action": "setDelay", "delaySeconds": 900 }

// Heartbeat response
{ "action": "pong" }
```

**Server → Client:**
```json
// Welcome message
{ "type": "welcome", "clientId": "uuid", "message": "..." }

// Bar update
{
  "type": "bar",
  "data": {
    "symbol": "ESZ25",
    "timestamp": 1700000000000,
    "open": 4500.25,
    "high": 4502.50,
    "low": 4499.75,
    "close": 4501.00,
    "volume": 1250
  }
}

// Status update
{ "type": "status", "connected": true, "subscriptions": [...] }

// Error
{ "type": "error", "message": "..." }

// Heartbeat ping
{ "type": "ping" }
```

**Connection Handling:**
- Auto-connect on app load
- Auto-reconnect with exponential backoff
- Heartbeat monitoring (ping/pong)
- Subscription state preservation on reconnect
- Error recovery

---

## Data Flow

### Initial Load Sequence

```
1. App Loads (app/main/page.tsx)
   ↓
2. EdgeClient.getHealth()
   - Verify Edge server is up
   ↓
3. EdgeClient.getLatestBars()
   - Load initial snapshot
   ↓
4. EdgeClient.getSymbolsGrouped()
   - Get asset class organization
   ↓
5. Store data in Zustand stores
   - DashboardStore.setBars(bars)
   - DashboardStore.setSymbols(symbols)
   ↓
6. Render UI with initial data
   ↓
7. EdgeWSClient.connect()
   - Establish WebSocket connection
   ↓
8. EdgeWSClient.subscribe(["*"])
   - Subscribe to all symbols
   ↓
9. Real-time updates flow
   - WS receives bar → Store updates → UI re-renders
```

### Real-time Update Flow

```
Edge Server publishes bar
   ↓
WebSocket Client receives message
   ↓
Parse and validate
   ↓
Call registered callbacks
   ↓
Update Zustand store
   - dashboardStore.updateBar(symbol, bar)
   - sentimentStore.updateMetrics(bar)
   - indicatorsStore.recalculate(symbol, bar)
   ↓
React components re-render
   - Only components subscing to that symbol
   - Optimized with selectors
   ↓
Chart updates
   - lightweight-charts.update(bar)
   - Sub-100ms target
```

---

## Component Hierarchy

### Main Dashboard Page

```
app/main/page.tsx (Root Page)
├── components/layout/Header
│   ├── Logo
│   ├── ContractSelector (global)
│   ├── ThemeToggle
│   └── ConnectionStatus
│
├── components/layout/Sidebar
│   ├── AssetClassNav
│   └── QuickActions
│
└── Main Content (3 sections)
    │
    ├─ 1. Dashboard Section
    │   ├── features/dashboard/FuturesGrid
    │   │   ├── FuturesCard (per symbol)
    │   │   │   ├── PriceDisplay
    │   │   │   ├── ChangeIndicator
    │   │   │   └── MiniChart
    │   │   └── ...more cards
    │   │
    │   └── features/dashboard/ContractDetails
    │       ├── VolumeDisplay
    │       └── OpenInterest
    │
    ├─ 2. Sentiment Section
    │   ├── features/sentiment/SentimentGauge
    │   ├── features/sentiment/VolumeHeatmap
    │   ├── features/sentiment/MarketBreadth
    │   └── features/sentiment/VolatilityIndex
    │
    └─ 3. Indicators Section
        ├── features/indicators/IndicatorPanel
        │   ├── RSIChart
        │   ├── MACDChart
        │   └── BollingerBands
        │
        └── features/indicators/MovingAverages
            ├── SMADisplay
            └── EMADisplay
```

---

## State Management

### Zustand Store Pattern

**Example: Dashboard Store**

```typescript
// lib/stores/dashboard-store.ts

interface DashboardState {
  // Data
  bars: Map<string, Bar>;
  symbols: string[];
  symbolsByAssetClass: Record<string, string[]>;
  selectedSymbol: string | null;
  
  // Actions
  setBars: (bars: BarMap) => void;
  updateBar: (symbol: string, bar: Bar) => void;
  setSymbols: (symbols: string[]) => void;
  selectSymbol: (symbol: string) => void;
  
  // Computed
  getLatestBar: (symbol: string) => Bar | undefined;
  getSymbolsByClass: (assetClass: string) => string[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  bars: new Map(),
  symbols: [],
  symbolsByAssetClass: {},
  selectedSymbol: null,
  
  setBars: (bars) => set({ bars: new Map(Object.entries(bars)) }),
  
  updateBar: (symbol, bar) => set((state) => {
    const newBars = new Map(state.bars);
    newBars.set(symbol, bar);
    return { bars: newBars };
  }),
  
  // ... more actions
  
  getLatestBar: (symbol) => get().bars.get(symbol),
  getSymbolsByClass: (assetClass) => get().symbolsByAssetClass[assetClass] || [],
}));
```

**Usage in Components:**

```typescript
// Subscribe to entire store
const { bars, updateBar } = useDashboardStore();

// Subscribe to specific values (optimized)
const selectedSymbol = useDashboardStore(state => state.selectedSymbol);

// Subscribe with selector (only re-render when ES changes)
const esBar = useDashboardStore(
  state => state.bars.get('ESZ25')
);
```

---

## Edge Server Integration

### REST API Endpoints (Port 3020)

**Base URL:** `http://localhost:3020`

#### Health & Monitoring

```
GET /health
Response: {
  status: "ok",
  uptime: 123456,
  cache: { symbols: 10, totalBars: 5000 },
  redis: { connected: true },
  hubConnected: true
}
```

#### Data Queries

```
GET /bars/latest
Response: { "ESZ25": Bar, "NQZ25": Bar, ... }

GET /bars/latest/:symbol
Response: Bar | null

GET /bars/history/:symbol?limit=100
Response: Bar[]
```

#### Symbol & Contract Queries

```
GET /symbols
Response: ["ESZ25", "NQZ25", ...]

GET /symbols/grouped
Response: {
  "us_indices": ["ESZ25", "NQZ25", "YMZ25", "RTYZ25"],
  "metals": ["GCZ25", "SIZ25", "HGZ25", ...]
}

GET /contracts/:root
Response: {
  root: "ES",
  assetClass: "us_indices",
  contracts: [
    { symbol: "ESZ25", month: "Z", year: 2025, isFrontMonth: true },
    { symbol: "ESH26", month: "H", year: 2026, isFrontMonth: false }
  ]
}
```

---

### WebSocket Protocol (Port 3021)

**Connection:** `ws://localhost:3021`

**Client Messages:**

| Action | Payload | Purpose |
|--------|---------|---------|
| `subscribe` | `{ symbols: string[] }` | Subscribe to symbols |
| `unsubscribe` | `{ symbols: string[] }` | Unsubscribe from symbols |
| `setDelay` | `{ delaySeconds: number }` | Set time delay |
| `pong` | - | Heartbeat response |

**Server Messages:**

| Type | Data | Purpose |
|------|------|---------|
| `welcome` | `{ clientId, message }` | Connection confirmation |
| `bar` | `{ data: Bar }` | Real-time bar update |
| `status` | `{ connected, subscriptions }` | Status update |
| `error` | `{ message }` | Error notification |
| `ping` | - | Heartbeat request |

---

### Connection Management Strategy

**1. Initial Connection:**
```typescript
// On app mount
useEffect(() => {
  wsClient.connect();
  wsClient.subscribe(['*']); // All symbols
  
  return () => wsClient.disconnect();
}, []);
```

**2. Reconnection Logic:**
```typescript
// Exponential backoff (matches Hub/Edge pattern)
const reconnect = () => {
  const delay = Math.min(500 * Math.pow(2, attempts), 20000);
  setTimeout(() => connect(), delay);
};
```

**3. Subscription Sync:**
```typescript
// Preserve subscriptions across reconnects
wsClient.onReconnect(() => {
  const currentSubs = connectionStore.getSubscriptions();
  wsClient.subscribe(currentSubs);
});
```

**4. Heartbeat Monitoring:**
```typescript
// Detect stale connections
wsClient.onPing(() => wsClient.send({ action: 'pong' }));

// If no ping for 30s, assume dead connection
const watchdog = setInterval(() => {
  if (Date.now() - lastPing > 30000) {
    wsClient.reconnect();
  }
}, 5000);
```

---

## Chart Architecture

### lightweight-charts Integration

**Why lightweight-charts?**
- TradingView's official library
- High performance (60 FPS with 10,000+ bars)
- Small bundle size (~50KB)
- Real-time updates
- Futures-focused features

**Chart Component Structure:**

```typescript
// components/charts/FuturesChart.tsx

interface FuturesChartProps {
  symbol: string;
  bars: Bar[];
  indicators?: Indicator[];
  height?: number;
}

export const FuturesChart = ({ symbol, bars, indicators, height = 400 }) => {
  const chartRef = useRef<IChartApi>();
  const seriesRef = useRef<ISeriesApi<'Candlestick'>>();
  
  // Initialize chart
  useEffect(() => {
    chartRef.current = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { color: '#000' }, textColor: '#fff' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
    });
    
    seriesRef.current = chartRef.current.addCandlestickSeries();
    seriesRef.current.setData(bars);
  }, []);
  
  // Update on new bar
  useEffect(() => {
    if (bars.length > 0) {
      const latestBar = bars[bars.length - 1];
      seriesRef.current?.update(latestBar);
    }
  }, [bars]);
  
  // Add indicator overlays
  useEffect(() => {
    indicators?.forEach(ind => {
      const lineSeries = chartRef.current?.addLineSeries({
        color: ind.color,
        lineWidth: 2,
      });
      lineSeries?.setData(ind.data);
    });
  }, [indicators]);
  
  return <div ref={containerRef} />;
};
```

**Performance Optimization:**
- Use `update()` for real-time bars (not `setData()`)
- Limit historical bars loaded (e.g., 1000 max)
- Debounce resize events
- Cleanup on unmount

---

## Future Extensions

### 1. TimescaleDB Integration

**Purpose:** Historical data beyond Edge cache

**Implementation:**
```
Frontend REST Client
   ↓
Edge Server (new endpoint: /bars/historical)
   ↓
TimescaleDB Query
   ↓
Return minute/hourly bars for date range
   ↓
Chart displays full history
```

**New API Endpoint:**
```
GET /bars/historical/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD&interval=1m
Response: Bar[]
```

**UI Changes:**
- Date range picker in chart controls
- Loading indicator for historical queries
- Cache historical data in IndexedDB (browser storage)

---

### 2. AI Features

**Use Cases:**
- Pattern recognition (head & shoulders, triangles)
- Price prediction (next 15 min, 1 hour)
- Anomaly detection (unusual volume spikes)
- Smart alerts (ML-based triggers)

**Architecture:**
```
Frontend
   ↓
Edge Server (new endpoint: /ai/predict)
   ↓
ML Service (Python FastAPI)
   ↓
Trained Models
   ↓
Return predictions
   ↓
Display in UI (confidence scores, visualizations)
```

**New Components:**
- `features/ai/PatternRecognition`
- `features/ai/PricePrediction`
- `features/ai/SmartAlerts`

---

### 3. Backtesting Engine

**Purpose:** Test strategies against historical data

**Architecture:**
```
Frontend (Strategy Builder UI)
   ↓
Define strategy (rules, indicators, entry/exit)
   ↓
Send to Edge Server (POST /backtest/run)
   ↓
Edge queries TimescaleDB for historical bars
   ↓
Backtest engine simulates strategy
   ↓
Return results (PnL, trades, metrics)
   ↓
Display in UI (equity curve, trade list, stats)
```

**New Pages:**
- `app/backtest/page.tsx`
- Strategy builder interface
- Results visualization
- Performance metrics

**New Components:**
- `features/backtest/StrategyBuilder`
- `features/backtest/ResultsChart`
- `features/backtest/TradeList`
- `features/backtest/Metrics`

---

### 4. Advanced Analytics

**Volume Profile:**
- Price levels by volume
- High volume nodes (support/resistance)
- Point of control

**Correlation Analysis:**
- Inter-contract correlations (ES vs NQ)
- Spread relationships
- Cointegration detection

**Seasonality:**
- Historical patterns by month/quarter
- Roll period analytics
- Expiry effects

---

## Performance Considerations

### Optimization Strategies

**1. Selective Subscriptions:**
```typescript
// Only subscribe to visible symbols
const visibleSymbols = useMemo(() => {
  return symbols.filter(s => isSymbolVisible(s, viewport));
}, [symbols, viewport]);

wsClient.subscribe(visibleSymbols);
```

**2. Debounced Updates:**
```typescript
// Batch rapid updates (e.g., during high volume)
const debouncedUpdate = useMemo(
  () => debounce((bar) => updateChart(bar), 50),
  []
);
```

**3. Virtual Scrolling:**
```typescript
// Large symbol lists
<VirtualList
  items={symbols}
  height={600}
  itemHeight={80}
  renderItem={(symbol) => <FuturesCard symbol={symbol} />}
/>
```

**4. Code Splitting:**
```typescript
// Lazy load sections
const IndicatorsSection = lazy(() => import('@/features/indicators'));
const SentimentSection = lazy(() => import('@/features/sentiment'));
```

**5. Memoization:**
```typescript
// Expensive calculations
const sentimentScore = useMemo(
  () => calculateSentiment(bars, volume),
  [bars, volume]
);
```

---

## Technology Decisions

### Why Next.js?
- Server components for fast initial load
- App router for modern routing
- Built-in optimization (fonts, images)
- Easy deployment (Vercel, self-hosted)

### Why Zustand over Redux?
- Simpler API (less boilerplate)
- Smaller bundle size
- No context provider needed
- Easier to test
- Matches backend's "less is more" philosophy

### Why lightweight-charts?
- Official TradingView library
- Best performance for real-time data
- Futures-focused features
- Small bundle size
- Active maintenance

### Why shadcn/ui?
- Accessible by default (Radix UI)
- Customizable (own our components)
- Beautiful design out of the box
- Copy/paste components (no NPM bloat)
- TypeScript-first

---

## Security Considerations

### WebSocket Connection
- No authentication initially (localhost dev)
- Future: JWT tokens
- Rate limiting on Edge server

### API Calls
- No sensitive data exposed
- Public market data only
- CORS configured on Edge server

### User Data
- Local storage for preferences
- No PII stored
- Session state only

---

## Next Steps

**Phase 1 (Weeks 1-2):**
1. Implement EdgeClient (REST)
2. Implement EdgeWSClient (WebSocket)
3. Create Zustand stores
4. Build base layout

**Phase 2 (Weeks 3-4):**
1. Dashboard section
2. Real-time price grid
3. Contract selector
4. Mini charts

**Phase 3 (Weeks 5-6):**
1. Market sentiment section
2. Indicators section
3. Polish and optimization

---

*Architecture built for performance, designed for scale.*

