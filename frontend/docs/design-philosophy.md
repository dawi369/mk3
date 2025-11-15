# Design Philosophy

**Last Updated:** November 15, 2025  
**Inspiration:** [Fey](https://fey.com/)  
**Focus:** Futures trading clarity and effortless experience

---

## Core Principles

### 1. Clarity Over Complexity

**From Fey's Approach:**
> "Turns complex data, gated tools, and noisy news into instant alerts, clear summaries, and a beautiful interface—so anyone can stay informed, without feeling overwhelmed."

**Our Application:**
- Futures market data can be overwhelming (multiple contracts, technical jargon, fast-moving prices)
- **Solution:** Clear visual hierarchy, progressive disclosure, instant understanding

**Examples:**
- **Price Changes:** Green/red with arrows, not just numbers
- **Contract Selection:** "Front Month (ESZ25)" not just "ESZ25"
- **Indicators:** Visual gauges with context, not raw numbers

---

### 2. From Overwhelming to Effortless

**Fey's Promise:**
> "From overwhelming to effortless"

**Our Challenge:**
- Real-time price streams (can be 1 bar/second)
- 50+ futures contracts
- Technical indicators (RSI, MACD, etc.)
- Market sentiment data

**Our Solutions:**

#### Smart Defaults
```typescript
// User doesn't choose - we show what matters
Default View:
- Front month contracts only
- Top 4 indices (ES, NQ, YM, RTY)
- Core indicators (RSI, MACD)
- Current market sentiment

// Advanced users can expand
- All contracts dropdown
- Custom indicator combinations
- Detailed metrics
```

#### Progressive Disclosure
```
Level 1 (At-a-glance): Price + Change
   ↓ Hover
Level 2 (Quick detail): Volume, High/Low
   ↓ Click
Level 3 (Deep dive): Full chart, all indicators
```

#### Intelligent Grouping
- Asset classes (Indices, Metals, Energies)
- Not alphabetical (ES, GC, NQ, SI...)
- But logical (ES/NQ/YM/RTY, then GC/SI/HG...)

---

### 3. Beautiful by Default

**Fey's Design Language:**
- Clean, modern interface
- Sophisticated color palette
- Subtle animations
- Generous whitespace
- Beautiful typography

**Our Design System:**

#### Color Palette

**Dark Theme (Primary):**
```css
--background: #0A0A0F          /* Deep black-blue */
--surface: #1A1A24             /* Card backgrounds */
--surface-elevated: #2A2A38    /* Elevated elements */
--border: #3A3A48              /* Subtle borders */
--text-primary: #FFFFFF        /* Primary text */
--text-secondary: #A0A0B0      /* Secondary text */
--text-muted: #606070          /* Muted text */

/* Semantic Colors */
--green: #10B981               /* Positive, bullish */
--red: #EF4444                 /* Negative, bearish */
--blue: #3B82F6                /* Interactive, links */
--yellow: #F59E0B              /* Warnings, alerts */
--purple: #8B5CF6              /* Indicators, special */
```

**Light Theme:**
```css
--background: #FFFFFF          
--surface: #F9FAFB            
--surface-elevated: #F3F4F6    
--border: #E5E7EB              
--text-primary: #111827        
--text-secondary: #6B7280      
--text-muted: #9CA3AF          
```

#### Typography

**Font Stack:**
```css
/* Primary: Geist Sans (or Inter) */
--font-sans: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace: Geist Mono (for prices, technical data) */
--font-mono: 'Geist Mono', 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
```

**Type Scale:**
```css
--text-xs: 0.75rem;    /* 12px - Labels */
--text-sm: 0.875rem;   /* 14px - Secondary text */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Emphasized */
--text-xl: 1.25rem;    /* 20px - Headings */
--text-2xl: 1.5rem;    /* 24px - Section titles */
--text-3xl: 1.875rem;  /* 30px - Page titles */
--text-4xl: 2.25rem;   /* 36px - Hero prices */
```

#### Spacing System

**Consistent, predictable spacing:**
```css
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

---

### 4. Instant Understanding

**Fey's Approach:**
> "See your personalized feed with curated news, daily recaps, and market performance. Updated continuously to keep you ahead."

**Our Equivalent:**

#### Visual Cues That Speak

**Price Display:**
```
Bad:  4501.25

Good: 
  ↑ 4501.25
  +12.50 (+0.28%)
  [Green background]
```

**Sentiment Gauge:**
```
Bad:  Sentiment: 0.73

Good:
  [Visual gauge with needle]
  Bullish
  73% positive momentum
```

**Volume Heatmap:**
```
Bad:  ES: 125000, NQ: 98000

Good:
  [Visual heatmap with colors]
  ES: Hot (highest volume)
  NQ: Active
  YM: Light
```

#### Context, Always

**Never show data without context:**

❌ Bad:
```
RSI: 72
```

✅ Good:
```
RSI: 72 (Overbought)
⚠️ Consider reversal
```

❌ Bad:
```
Volume: 125,000
```

✅ Good:
```
Volume: 125K
150% above average
```

---

### 5. Effortless Navigation

**Fey's Features:**
- Command K (keyboard navigation)
- Drag to reorder
- Smooth transitions
- Predictable interactions

**Our Implementation:**

#### Keyboard Shortcuts

```typescript
// Global shortcuts
'Cmd/Ctrl + K'  → Command palette (quick search)
'/'             → Focus search
'Cmd/Ctrl + ,'  → Settings
'D'             → Toggle dark/light theme
'Esc'           → Close modals/dropdowns

// Navigation
'1'             → Dashboard section
'2'             → Sentiment section
'3'             → Indicators section
'G then D'      → Go to Dashboard
'G then S'      → Go to Sentiment

// Symbol selection
'Cmd/Ctrl + P'  → Quick symbol picker
'E S Enter'     → Jump to ES chart
'N Q Enter'     → Jump to NQ chart

// Actions
'R'             → Refresh data
'F'             → Toggle fullscreen chart
'Cmd/Ctrl + D'  → Add to watchlist
```

#### Drag & Drop

```typescript
// Reorder watchlist
<DraggableList>
  {symbols.map(s => <DraggableSymbolCard symbol={s} />)}
</DraggableList>

// Customize dashboard layout
<GridLayout draggable resizable>
  <PriceCard />
  <ChartCard />
  <IndicatorCard />
</GridLayout>
```

#### Smooth Transitions

```css
/* All transitions follow consistent timing */
--transition-fast: 150ms ease;     /* Hovers, small UI changes */
--transition-base: 250ms ease;     /* Modals, dropdowns */
--transition-slow: 350ms ease;     /* Page transitions */

/* Examples */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-fast);
}

.modal-enter {
  opacity: 0;
  transform: scale(0.95);
  animation: modal-enter var(--transition-base);
}
```

---

## Component Design Patterns

### Card Pattern (Fey-inspired)

**Futures Price Card:**

```tsx
// Visual structure
┌─────────────────────────────────────┐
│ ES • E-mini S&P 500      [★]        │  ← Header (symbol + watchlist)
├─────────────────────────────────────┤
│                                     │
│  ↑ 4501.25                          │  ← Large price + direction
│  +12.50 (+0.28%)                    │  ← Change (color-coded)
│                                     │
│  [Mini chart visualization]         │  ← Sparkline/mini chart
│                                     │
├─────────────────────────────────────┤
│ Vol: 125K  •  O/I: 2.1M            │  ← Footer (contextual data)
└─────────────────────────────────────┘

// Implementation
<Card variant="futures">
  <CardHeader>
    <SymbolBadge symbol="ES" name="E-mini S&P 500" />
    <WatchlistButton symbol="ES" />
  </CardHeader>
  
  <CardContent>
    <PriceDisplay 
      price={4501.25} 
      change={12.50} 
      changePercent={0.28}
      direction="up"
    />
    <MiniChart symbol="ES" height={60} />
  </CardContent>
  
  <CardFooter>
    <MetricBadge label="Vol" value="125K" />
    <MetricBadge label="O/I" value="2.1M" />
  </CardFooter>
</Card>
```

**Design Specs:**
- Border radius: `12px` (generous, modern)
- Padding: `24px` (spacious)
- Border: `1px solid var(--border)`
- Shadow on hover: Subtle elevation
- Background: `var(--surface)`
- Transition: `150ms ease`

---

### Chart Pattern

**Full Chart View:**

```tsx
// Layout
┌────────────────────────────────────────────────────────┐
│ ES Z25 • E-mini S&P 500                    [⚙️] [↗️]   │  ← Header
├────────────────────────────────────────────────────────┤
│                                                        │
│  [Timeframe selector: 1m 5m 15m 1h 4h 1d]            │
│                                                        │
│              [Chart with candlesticks]                 │
│                                                        │
│              Height: 400-600px                         │
│                                                        │
│  [Volume bars below main chart]                        │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [Indicator tabs: RSI | MACD | Bollinger | MA]         │  ← Footer
└────────────────────────────────────────────────────────┘

// Implementation with lightweight-charts
<ChartContainer>
  <ChartHeader>
    <SymbolInfo symbol="ESZ25" />
    <ChartControls>
      <TimeframeSelector />
      <ChartSettings />
      <FullscreenButton />
    </ChartControls>
  </ChartHeader>
  
  <LightweightChart
    symbol="ESZ25"
    timeframe="5m"
    indicators={selectedIndicators}
    height={500}
  />
  
  <ChartFooter>
    <IndicatorTabs />
  </ChartFooter>
</ChartContainer>
```

---

### Sentiment Gauge Pattern

**Visual Gauge (Fey-inspired):**

```tsx
// Circular gauge (like Fey's polished look)
         ┌─────────┐
        ╱           ╲
       │   Bullish   │
       │             │
       │     73%     │
       │             │
        ╲           ╱
         └─────────┘
      [Needle pointing right]

// Implementation
<SentimentGauge
  value={73}
  label="Bullish"
  color="green"
  subtitle="150% above avg volume"
/>

// Or linear gauge (simpler)
  Bearish ────●───────── Bullish
         0    73       100
```

---

## Animation Principles

### Microinteractions

**Purpose:** Provide feedback, delight users

**Examples:**

1. **Price Update:**
```typescript
// Flash green/red on price change
<AnimatePresence>
  <motion.div
    key={price}
    initial={{ backgroundColor: change > 0 ? '#10B98140' : '#EF444440' }}
    animate={{ backgroundColor: 'transparent' }}
    transition={{ duration: 0.5 }}
  >
    {price}
  </motion.div>
</AnimatePresence>
```

2. **Card Hover:**
```css
.futures-card {
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.futures-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

3. **Loading States:**
```tsx
// Skeleton screens (not spinners)
<div className="animate-pulse">
  <div className="h-8 bg-surface rounded w-32 mb-2" />
  <div className="h-12 bg-surface rounded w-48" />
</div>
```

4. **Notification Toast:**
```typescript
// Slide in from top-right
toast.success('Subscribed to ESZ25', {
  position: 'top-right',
  duration: 3000,
  style: {
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--green)',
  },
});
```

---

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};
```

### Layout Adaptations

**Desktop (>1024px):**
```
┌──────────────────────────────────────────┐
│  Header                                  │
├────┬─────────────────────────────────────┤
│    │  Dashboard (Grid: 3-4 columns)     │
│ S  ├─────────────────────────────────────┤
│ i  │  Sentiment (Side-by-side)          │
│ d  ├─────────────────────────────────────┤
│ e  │  Indicators (Charts side-by-side)  │
│ b  │                                     │
│ a  │                                     │
│ r  │                                     │
└────┴─────────────────────────────────────┘
```

**Tablet (768px - 1024px):**
```
┌──────────────────────────────────┐
│  Header                          │
├──────────────────────────────────┤
│  Dashboard (Grid: 2 columns)     │
├──────────────────────────────────┤
│  Sentiment (Stacked)             │
├──────────────────────────────────┤
│  Indicators (1 chart at a time)  │
└──────────────────────────────────┘
```

**Mobile (<768px):**
```
┌───────────────┐
│  Header       │
├───────────────┤
│  [Tab Nav]    │
│  Dashboard |  │
├───────────────┤
│  Symbol Card  │
│  Symbol Card  │
│  (1 column)   │
└───────────────┘
```

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text on background: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Interactive elements: Clear focus states

**Keyboard Navigation:**
- All interactive elements reachable via Tab
- Visible focus indicators
- Skip links for main content
- Modal focus trapping

**Screen Readers:**
- Semantic HTML (`<nav>`, `<main>`, `<section>`)
- ARIA labels where needed
- Live regions for price updates
- Alternative text for charts (data tables)

**Example:**
```tsx
<button
  aria-label="Add ES to watchlist"
  aria-pressed={isWatched}
  onClick={toggleWatchlist}
>
  <StarIcon />
</button>

<div
  role="region"
  aria-live="polite"
  aria-atomic="true"
>
  Price updated: {price}
</div>
```

---

## Performance Budget

### Target Metrics

- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Time to Interactive:** < 3.0s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

### Optimization Strategies

**Code Splitting:**
```typescript
// Lazy load sections
const IndicatorsSection = lazy(() => import('@/features/indicators'));

// Lazy load charts
const FuturesChart = lazy(() => import('@/components/charts/FuturesChart'));
```

**Image Optimization:**
```tsx
// Next.js Image component
<Image
  src="/logo.png"
  alt="MK3 Logo"
  width={120}
  height={40}
  priority // For above-the-fold images
/>
```

**Font Loading:**
```typescript
// next/font with display swap
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
```

---

## Error States

### User-Friendly Error Messages

**Connection Error:**
```
❌ Lost Connection to Market Data

We're having trouble connecting to real-time data.
This usually resolves in a few seconds.

[Retry Now]  [View Cached Data]
```

**No Data Available:**
```
📊 No Data for This Symbol Yet

We're waiting for the first bar from the market.
This is normal when markets just opened.

Expected: Within 1 minute
```

**API Error:**
```
⚠️ Something Went Wrong

We couldn't load the latest prices.
Your connection is fine - this is on us.

[Try Again]  [Contact Support]
```

---

## Empty States

**No Watchlist:**
```
⭐ Build Your Watchlist

Add futures contracts you want to track.
They'll appear here for quick access.

[Browse Contracts]
```

**No Indicators Selected:**
```
📈 Add Technical Indicators

Choose from RSI, MACD, Bollinger Bands, and more
to enhance your analysis.

[Browse Indicators]
```

---

## Loading States

### Skeleton Screens (Not Spinners)

```tsx
// Price card skeleton
<div className="animate-pulse">
  <div className="h-6 bg-surface rounded w-24 mb-4" />
  <div className="h-12 bg-surface rounded w-32 mb-2" />
  <div className="h-4 bg-surface rounded w-20" />
</div>

// Chart skeleton
<div className="animate-pulse">
  <div className="h-80 bg-surface rounded" />
</div>
```

---

## Success Metrics

### User Experience Goals

- **Time to first price:** < 2 seconds
- **Price update latency:** < 100ms from WebSocket
- **Navigation response:** < 50ms (instant feel)
- **Chart rendering:** 60 FPS smooth
- **Zero layout shifts:** Stable, predictable UI

---

## Next Steps

**Phase 1:**
1. Implement design system (colors, typography, spacing)
2. Create base components (Card, Button, Badge)
3. Build theme switcher

**Phase 2:**
1. Design futures card component
2. Implement chart wrapper with lightweight-charts
3. Create sentiment gauge component

**Phase 3:**
1. Polish animations and transitions
2. Implement keyboard shortcuts
3. Accessibility audit

---

*Designed with care. Built for traders. Inspired by the best.*

