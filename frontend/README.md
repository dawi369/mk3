# MK3 Futures Dashboard - Frontend

**A beautiful, effortless futures trading experience.**

Inspired by [Fey](https://fey.com/), MK3 transforms complex futures market data into clear, actionable insights with a modern interface built for traders.

---

## Vision

> "From overwhelming to effortless"

MK3 brings real-time futures data, technical indicators, and market sentiment into a unified dashboard that's:
- **Beautiful** - Clean, modern design that gets out of your way
- **Fast** - Sub-100ms updates, smooth 60 FPS charts
- **Intelligent** - AI-powered insights (future)
- **Powerful** - Real-time data from 50+ futures contracts

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix primitives)
- **Charts:** lightweight-charts (TradingView)
- **State:** Zustand
- **Real-time:** WebSocket (socket.io-client)

---

## Quick Start

### Prerequisites

- Node.js 18+
- Edge server running (`localhost:3002` REST, `localhost:3003` WebSocket)
- Hub server running (data ingestion)

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local`:

```bash
# Edge Server (backend)
NEXT_PUBLIC_EDGE_REST_URL=http://localhost:3002
NEXT_PUBLIC_EDGE_WS_URL=ws://localhost:3003

# Feature Flags (future)
NEXT_PUBLIC_ENABLE_TIMESCALE=false
NEXT_PUBLIC_ENABLE_AI_FEATURES=false
NEXT_PUBLIC_ENABLE_BACKTESTING=false
```

### Development

```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010)

### Build

```bash
npm run build
npm run start
```

Open [http://localhost:3010](http://localhost:3010)

### Troubleshooting

#### Firefox SSL Error (SSL_ERROR_RX_RECORD_TOO_LONG)

If you see "SSL received a record that exceeded the maximum permissible length" in Firefox:

**Cause:** Firefox is trying to connect via HTTPS, but the server only serves HTTP. This happens when Firefox has cached an HSTS (HTTP Strict Transport Security) policy for `localhost:3010`.

**Solution:**

1. **Clear Firefox HSTS cache:**
   - Type `about:config` in the address bar
   - Search for `security.tls.insecure_fallback_hosts`
   - Add `localhost` to the list (comma-separated)
   - Or search for `dom.security.https_only_mode` and set it to `false` for localhost

2. **Alternative - Use HTTP explicitly:**
   - Make sure you're accessing `http://localhost:3010` (not `https://`)
   - If Firefox auto-completes to HTTPS, clear the address bar and type `http://` manually

3. **Quick fix - Private window:**
   - Open a private/incognito window in Firefox
   - Navigate to `http://localhost:3010`

**Note:** Chrome works fine because it's less strict about HSTS for localhost. Firefox enforces HSTS more strictly, which is why you see this error.

---

## Deployment & HTTPS

### HTTPS in Production

**Yes, you'll have proper HTTPS when you deploy** - but it depends on your deployment method:

#### Option 1: Platform-as-a-Service (Automatic HTTPS)

**Vercel, Netlify, Railway, etc.**
- ✅ **Automatic HTTPS** - These platforms provide SSL certificates automatically
- ✅ **Zero configuration** - Just deploy, HTTPS works out of the box
- ✅ **Auto-renewal** - Certificates are managed for you

**Your code is already ready:**
- The auth callback route (`src/app/auth/callback/route.ts`) already expects HTTPS in production
- It uses `x-forwarded-host` header to construct HTTPS URLs

#### Option 2: Self-Hosted (Reverse Proxy Required)

**Docker, VPS, or bare metal**

You'll need a reverse proxy to handle SSL termination:

**Nginx Example:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**Caddy (Automatic HTTPS):**
```caddy
yourdomain.com {
    reverse_proxy localhost:3010
}
```
Caddy automatically obtains and renews Let's Encrypt certificates.

**Traefik (Docker):**
```yaml
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
```

### Important Notes

1. **Next.js doesn't handle HTTPS directly** - It runs on HTTP internally, even in production
2. **SSL termination happens at the reverse proxy** - The proxy handles HTTPS and forwards HTTP to Next.js
3. **Your code already handles this** - The auth callback checks `x-forwarded-host` and uses HTTPS URLs in production
4. **Environment variables** - Make sure `NODE_ENV=production` is set in production

### Recommended Deployment Options

1. **Vercel** (Easiest) - Automatic HTTPS, zero config
2. **Railway/Render** - Automatic HTTPS, simple setup
3. **Self-hosted with Caddy** - Automatic Let's Encrypt, minimal config
4. **Self-hosted with Nginx** - Full control, manual certificate management

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app router
│   │   └── main/               # Main dashboard (codename: main)
│   │
│   ├── features/               # Feature modules
│   │   ├── dashboard/          # Real-time futures grid
│   │   ├── sentiment/          # Market sentiment
│   │   └── indicators/         # Technical indicators
│   │
│   ├── components/             # Shared components
│   │   ├── ui/                 # shadcn components
│   │   ├── charts/             # Chart wrappers
│   │   └── layout/             # Layout components
│   │
│   ├── lib/                    # Core utilities
│   │   ├── api/                # Edge server clients
│   │   ├── stores/             # Zustand stores
│   │   └── hooks/              # Custom hooks
│   │
│   ├── config/                 # Configuration
│   │   ├── env.ts              # Environment variables
│   │   ├── api.config.ts       # API endpoints
│   │   └── chart.config.ts     # Chart defaults
│   │
│   └── types/                  # TypeScript types
│       ├── api.types.ts        # Edge API types
│       ├── bar.types.ts        # Bar data
│       └── contract.types.ts   # Futures contracts
│
└── docs/                       # Documentation
    ├── README.md               # Start here
    ├── architecture.md         # Technical architecture
    ├── design-philosophy.md    # Fey-inspired design
    ├── edge-integration.md     # Backend integration
    ├── component-guidelines.md # Development standards
    ├── state-management.md     # State patterns
    └── future-roadmap.md       # Future enhancements
```

---

## Core Features

### Main Dashboard (3 Sections)

#### 1. **Dashboard** - Real-time Futures
- Live price grid (ES, NQ, YM, RTY, GC, SI, etc.)
- Contract selector (front month, specific contracts)
- Mini charts with lightweight-charts
- Asset class grouping
- Price change indicators

#### 2. **Market Sentiment**
- Volume analysis
- Market breadth
- Sentiment gauges
- Volatility metrics

#### 3. **Technical Indicators**
- RSI, MACD, Bollinger Bands
- Moving averages (SMA, EMA)
- Chart overlays
- Alert triggers

---

## Documentation

**Read the docs:** [`/docs/README.md`](./docs/README.md)

### Key Documents

1. **[README.md](./docs/README.md)** - Vision, quick start, overview
2. **[architecture.md](./docs/architecture.md)** - System design, data flow, Edge integration
3. **[design-philosophy.md](./docs/design-philosophy.md)** - Fey-inspired UX, design system, patterns
4. **[edge-integration.md](./docs/edge-integration.md)** - WebSocket protocol, REST API, examples
5. **[future-roadmap.md](./docs/future-roadmap.md)** - TimescaleDB, AI features, backtesting

---

## Data Flow

```
Hub Server (Polygon.io)
   ↓
Redis Pub/Sub
   ↓
Edge Server (localhost:3002/3003)
   ├─ REST API (initial data)
   └─ WebSocket (real-time stream)
      ↓
Frontend (this app)
   ├─ Zustand Stores (state management)
   └─ React Components (UI)
```

---

## Design Philosophy

Inspired by [Fey](https://fey.com/), our design prioritizes:

1. **Clarity Over Complexity** - Clean visual hierarchy, progressive disclosure
2. **From Overwhelming to Effortless** - Smart defaults, intelligent grouping
3. **Beautiful by Default** - Modern, sophisticated design
4. **Instant Understanding** - Visual cues, contextual data
5. **Effortless Navigation** - Keyboard shortcuts, smooth transitions

**Example:**
```
❌ Bad:  4501.25

✅ Good: ↑ 4501.25
         +12.50 (+0.28%)
         [Green background]
```

---

## Key Technologies

### lightweight-charts

**Why?** TradingView's official charting library
- High performance (60 FPS with 10,000+ bars)
- Small bundle size (~50KB)
- Real-time updates
- Futures-focused

**Usage:**
```typescript
import { createChart } from 'lightweight-charts';

const chart = createChart(container, {
  height: 400,
  layout: { background: { color: '#000' } }
});

const series = chart.addCandlestickSeries();
series.setData(bars);

// Real-time update
series.update(newBar);
```

### Zustand

**Why?** Simple, performant state management
- Minimal boilerplate
- No context providers
- Easy to test
- Matches backend's "less is more" philosophy

**Usage:**
```typescript
const useDashboardStore = create((set) => ({
  bars: new Map(),
  updateBar: (symbol, bar) => set((state) => {
    const newBars = new Map(state.bars);
    newBars.set(symbol, bar);
    return { bars: newBars };
  }),
}));
```

---

## Development

### Code Style

Following your rules:
- **Clarity over cleverness** - Simple, readable code
- **Small functions** - Single purpose
- **Minimal comments** - Explain "why", not "what"
- **No over-engineering** - Keep it simple
- **const by default** - Use let when needed
- **Async/await** - Prefer over promises

### Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Lint
npm run lint
```

---

## Current Status

### ✅ Phase 0: Planning & Setup (Current)
- [x] Project structure created
- [x] Dependencies installed (Next.js, TypeScript, Tailwind, shadcn, lightweight-charts, Zustand)
- [x] Documentation written
- [ ] Type definitions from Edge server
- [ ] Base layout and theme

### 🔄 Phase 1: Core Infrastructure (Next - ~2 weeks)
- [ ] Edge REST client
- [ ] Edge WebSocket client
- [ ] Zustand stores
- [ ] Base layout (header, sidebar)
- [ ] Theme system (dark/light)

### 🔜 Phase 2: Dashboard Section (~2 weeks)
- [ ] Real-time price grid
- [ ] Contract selector
- [ ] Mini charts
- [ ] WebSocket integration

### 🔜 Phase 3: Market Sentiment (~1-2 weeks)
- [ ] Volume analysis
- [ ] Sentiment gauges
- [ ] Market breadth

### 🔜 Phase 4: Indicators Section (~2 weeks)
- [ ] Technical indicators
- [ ] Chart overlays
- [ ] Custom indicators

---

## Future Enhancements

### TimescaleDB Integration (3-5 months)
- Historical bar data (years of 1-min bars)
- Custom date range queries
- Long-term charts

### AI Features (6-9 months)
- Pattern recognition (head & shoulders, triangles)
- Price predictions (LSTM models)
- Anomaly detection
- Smart alerts

### Backtesting Engine (10-12 months)
- Visual strategy builder
- Historical simulation
- Performance metrics
- Risk analysis

See [future-roadmap.md](./docs/future-roadmap.md) for details.

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

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari, Chrome Android

---

## Contributing

### Before You Start
1. Read all documentation in `/docs/`
2. Run Edge and Hub servers locally
3. Follow code style guidelines
4. Keep changes small and focused

### Development Principles
1. **Less is more** - Simplicity over complexity
2. **Performance matters** - Every millisecond counts
3. **Users first** - Think about the trader experience
4. **Beautiful code** - Clean, readable, maintainable

---

## Project Context

- **Backend:** See `../backend/` for Hub and Edge servers
- **Data Source:** Polygon.io WebSocket API
- **Data Flow:** Hub → Redis → Edge → Frontend
- **Real-time:** WebSocket streaming (1 bar/second during market hours)

---

## Support

**Project:** MK3 Futures Dashboard  
**Owner:** David  
**Environment:** WSL2, Node.js 18+  
**Repository:** `/home/david/dev/mk3/frontend`

For backend details, see `../backend/docs/`

---

## Next Steps

**This Week:**
1. ✅ Complete documentation
2. Define Edge API types
3. Create base layout and theme
4. Set up WebSocket client skeleton

**Next 2 Weeks:**
1. Implement Edge clients (REST + WebSocket)
2. Create Zustand stores
3. Build dashboard grid
4. Basic real-time integration

**Next 1-2 Months:**
1. Market sentiment section
2. Technical indicators
3. Polish and optimization
4. Responsive design

---

*Built with precision. Designed for clarity. Made for traders.*
