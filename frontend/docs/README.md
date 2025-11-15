# MK3 Futures Dashboard - Frontend Documentation

**Last Updated:** November 15, 2025  
**Status:** Planning & Setup Phase 🔄  
**Codename:** Main

---

## Vision

**A beautiful, effortless futures trading experience.**

Inspired by [Fey](https://fey.com/), MK3 transforms complex futures market data, real-time price streams, and technical indicators into clear insights with a modern, intuitive interface. Built exclusively for futures traders who demand:

- **Real-time clarity** - Live price updates without the noise
- **Instant insights** - Technical indicators that actually inform decisions
- **Market pulse** - Sentiment analysis across all major futures contracts
- **Effortless navigation** - Beautiful UI that gets out of your way

---

## Documentation Index

**[README.md](./README.md)** - Start here (this file)
- Vision and philosophy
- Quick start guide
- Documentation overview

**[architecture.md](./architecture.md)** - Technical architecture
- System design
- Data flow from Edge to UI
- Component hierarchy
- State management strategy

**[design-philosophy.md](./design-philosophy.md)** - Design principles
- Fey-inspired UX patterns
- Visual design system
- Interaction patterns
- Accessibility standards

**[edge-integration.md](./edge-integration.md)** - Backend integration
- Edge server WebSocket protocol
- REST API endpoints
- Real-time data streaming
- Connection management

**[component-guidelines.md](./component-guidelines.md)** - Development standards
- Component patterns
- Code style
- Testing approach
- Performance guidelines

**[state-management.md](./state-management.md)** - State architecture
- Zustand store design
- Real-time data synchronization
- Cache invalidation
- Optimistic updates

**[future-roadmap.md](./future-roadmap.md)** - Future features
- TimescaleDB integration for historical data
- AI-powered insights and alerts
- Backtesting engine
- Advanced analytics

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- Edge server running (port 3002 REST, 3003 WebSocket)
- Hub server running (data ingestion)

### Installation

```bash
cd /home/david/dev/mk3/frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:

```bash
# Edge Server
NEXT_PUBLIC_EDGE_REST_URL=http://localhost:3002
NEXT_PUBLIC_EDGE_WS_URL=ws://localhost:3003

# Feature Flags
NEXT_PUBLIC_ENABLE_TIMESCALE=false
NEXT_PUBLIC_ENABLE_AI_FEATURES=false
NEXT_PUBLIC_ENABLE_BACKTESTING=false
```

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                        # Next.js app router
│   │   └── main/                   # Main dashboard page (codename)
│   │       ├── page.tsx            # Dashboard, sentiment, indicators
│   │       └── layout.tsx          # Persistent layout
│   │
│   ├── features/                   # Feature modules
│   │   ├── dashboard/              # Real-time futures grid
│   │   ├── sentiment/              # Market sentiment analysis
│   │   └── indicators/             # Technical indicators
│   │
│   ├── components/                 # Shared components
│   │   ├── ui/                     # shadcn components
│   │   ├── charts/                 # lightweight-charts wrappers
│   │   └── layout/                 # Header, sidebar, etc.
│   │
│   ├── lib/                        # Core utilities
│   │   ├── api/                    # Edge server clients
│   │   ├── stores/                 # Zustand stores
│   │   └── hooks/                  # Shared hooks
│   │
│   ├── config/                     # Configuration
│   │   ├── env.ts                  # Environment variables
│   │   ├── api.config.ts           # API endpoints
│   │   └── chart.config.ts         # Chart defaults
│   │
│   └── types/                      # TypeScript types
│       ├── api.types.ts            # Edge API types
│       ├── bar.types.ts            # Bar/candle data
│       └── contract.types.ts       # Futures contracts
│
└── docs/                           # This folder
```

---

## Core Features

### Main Dashboard (Codename: Main)

The main dashboard is organized into three sections:

#### 1. **Dashboard** - Real-time Futures Grid
- Live price updates via WebSocket
- Multi-contract view (ES, NQ, YM, RTY, GC, SI, etc.)
- Contract selector (front month, next month, specific contracts)
- Mini charts with lightweight-charts
- Asset class grouping (indices, metals, energies, etc.)

#### 2. **Market Sentiment** - Market Pulse
- Volume analysis across contracts
- Price momentum indicators
- Market breadth (advancing vs declining)
- Volatility metrics
- Visual sentiment gauges

#### 3. **Indicators** - Technical Analysis
- Real-time technical indicators
- RSI, MACD, Bollinger Bands
- Moving averages (SMA, EMA)
- Custom indicator combinations
- Alert triggers

---

## Technology Stack

### Core Framework
- **Next.js 14+** - App router, React Server Components
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling

### UI Components
- **shadcn/ui** - Accessible, customizable components
- **Radix UI** - Unstyled primitives
- **Tailwind Variants** - Component variants

### Charting
- **lightweight-charts** - TradingView's performant charting library
- Real-time data streaming
- Multiple timeframes
- Custom overlays

### State Management
- **Zustand** - Lightweight, simple state management
- WebSocket connection state
- Real-time bar data cache
- User preferences

### Data Fetching
- **Native fetch** - REST API calls to Edge
- **WebSocket** - Real-time streaming
- **React hooks** - Data synchronization

---

## Design Philosophy

### Inspired by Fey

1. **Clarity Over Complexity**
   - Clean, uncluttered interface
   - Information hierarchy that guides the eye
   - Progressive disclosure of details

2. **Instant Understanding**
   - Visual cues for market direction
   - Color-coded sentiment indicators
   - At-a-glance price changes

3. **Effortless Navigation**
   - Keyboard shortcuts (Command K)
   - Smooth transitions
   - Predictable interactions

4. **Beautiful by Default**
   - Modern, sophisticated design
   - Thoughtful typography
   - Subtle animations that enhance (not distract)

5. **Performance First**
   - Sub-100ms UI updates
   - Optimistic rendering
   - Efficient re-renders

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Edge Server                          │
│  REST (3002) + WebSocket (3003)                         │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    REST API          WebSocket
         │                │
         ▼                ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend Application                        │
│                                                          │
│  ┌────────────────┐         ┌─────────────────────┐     │
│  │ Edge Client    │         │  WebSocket Client   │     │
│  │ (REST)         │         │  (Real-time Stream) │     │
│  └────────┬───────┘         └──────────┬──────────┘     │
│           │                            │                │
│           ▼                            ▼                │
│  ┌────────────────────────────────────────────────┐     │
│  │           Zustand Stores                       │     │
│  │  - Dashboard Store (latest bars, contracts)   │     │
│  │  - Sentiment Store (volume, breadth)          │     │
│  │  - Indicators Store (RSI, MACD, etc.)         │     │
│  └────────────────┬───────────────────────────────┘     │
│                   │                                     │
│                   ▼                                     │
│  ┌────────────────────────────────────────────────┐     │
│  │          React Components                      │     │
│  │  - Dashboard Grid (real-time prices)          │     │
│  │  - Sentiment Gauges                           │     │
│  │  - Indicator Charts (lightweight-charts)      │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## Current Status

### ✅ Phase 0: Planning & Setup (Complete)
- [x] Project structure created
- [x] Next.js + TypeScript + Tailwind configured
- [x] shadcn/ui installed
- [x] Documentation complete
- [x] Background system implemented
- [x] Design system colors in global CSS
- [x] Home and Dashboard pages created
- [ ] Type definitions from Edge server (next)

### 🔄 Phase 1: Core Infrastructure (Next - ~2 weeks)
- [ ] Edge REST client
- [ ] Edge WebSocket client
- [ ] Zustand stores setup
- [ ] Base layout (header, sidebar)
- [ ] Theme system (dark/light)
- [ ] Error boundaries

### 🔜 Phase 2: Dashboard Section (~2 weeks)
- [ ] Real-time price grid
- [ ] Contract selector
- [ ] Mini charts (lightweight-charts)
- [ ] Asset class grouping
- [ ] Price change indicators
- [ ] WebSocket integration

### 🔜 Phase 3: Market Sentiment (~1-2 weeks)
- [ ] Volume analysis
- [ ] Market breadth metrics
- [ ] Sentiment gauges
- [ ] Volatility indicators
- [ ] Visual heatmaps

### 🔜 Phase 4: Indicators Section (~2 weeks)
- [ ] Technical indicator calculations
- [ ] RSI, MACD, Bollinger Bands
- [ ] Moving averages
- [ ] Chart overlays
- [ ] Custom indicator builder

### 🔜 Phase 5: Polish & Optimization (~1 week)
- [ ] Performance optimization
- [ ] Keyboard shortcuts
- [ ] Responsive design
- [ ] Accessibility audit
- [ ] Loading states

---

## Future Enhancements

### TimescaleDB Integration
- Historical bar data
- Backfill charts with minute/hourly data
- Custom date range queries
- Performance analysis over time

### AI Features
- Pattern recognition
- Price prediction models
- Anomaly detection
- Smart alerts based on ML models
- Natural language queries

### Backtesting Engine
- Strategy builder interface
- Historical simulation
- Performance metrics
- Risk analysis
- Strategy optimization

### Advanced Analytics
- Portfolio tracking
- Risk metrics
- Correlation analysis
- Seasonality patterns
- Volume profile

---

## Development Workflow

### Feature Development

1. **Plan** - Document feature in `docs/`
2. **Types** - Define TypeScript types in `types/`
3. **Store** - Create Zustand store in `lib/stores/`
4. **Components** - Build UI in `features/` or `components/`
5. **Test** - Manual testing with running Edge server
6. **Polish** - Animations, error handling, loading states

### Code Standards

- **TypeScript strict mode** - No implicit any
- **ESLint + Prettier** - Consistent formatting
- **Component naming** - PascalCase for components, kebab-case for files
- **Props interfaces** - Always define component props
- **Comments** - Explain "why", not "what"

---

## Testing Strategy

### Manual Testing
- Test with Hub + Edge running
- Verify real-time updates
- Test WebSocket reconnection
- Validate error states
- Check loading states

### Future: Automated Testing
- Component tests (Vitest + React Testing Library)
- Integration tests (Playwright)
- Visual regression (Chromatic)
- Performance benchmarks

---

## Performance Targets

- **Initial load:** < 2 seconds
- **Time to interactive:** < 3 seconds
- **WebSocket message handling:** < 50ms
- **UI update on bar:** < 100ms
- **Chart rendering:** 60 FPS
- **Memory usage:** < 200MB for 50 symbols

---

## Browser Support

- **Chrome/Edge:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Safari:** Latest 2 versions
- **Mobile:** iOS Safari, Chrome Android

---

## Contributing

### Before You Start
1. Read all documentation in `docs/`
2. Run Edge and Hub servers locally
3. Follow code style guidelines
4. Keep changes small and focused

### Development Principles
1. **Less is more** - Simplicity over complexity
2. **Performance matters** - Every millisecond counts
3. **Users first** - Think about the trader experience
4. **Beautiful code** - Clean, readable, maintainable

---

## Support & Contact

**Project:** MK3 Futures Dashboard - Frontend  
**Framework:** Next.js 14+ with App Router  
**Environment:** WSL2, Node.js 18+  
**Repository:** `/home/david/dev/mk3/frontend`

For backend integration details, see `../backend/docs/`

---

## Next Steps

**Immediate (This Week):**
1. Complete documentation suite
2. Define Edge API types
3. Create base layout and theme
4. Set up WebSocket client skeleton

**Short-term (Next 2 Weeks):**
1. Implement dashboard grid
2. Real-time WebSocket integration
3. Basic charts with lightweight-charts
4. Contract selector UI

**Medium-term (Next 1-2 Months):**
1. Market sentiment section
2. Technical indicators
3. Full polish and optimization
4. Responsive design

---

*Built with precision. Designed for clarity. Made for traders.*

