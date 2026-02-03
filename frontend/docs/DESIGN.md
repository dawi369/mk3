# Design System

> Inspired by [Fey](https://fey.com/) — clarity over complexity

---

## Principles

1. **Clarity Over Complexity** — Clean hierarchy, progressive disclosure
2. **Effortless** — Smart defaults, instant understanding
3. **Beautiful** — Modern, sophisticated, subtle animations
4. **Performance** — Sub-100ms updates, 60 FPS charts

---

## Theme

### Colors (HSL tokens in `globals.css`)

```css
/* Dark mode (default) */
--background: 240 10% 3.9%;
--foreground: 0 0% 98%;
--primary: 0 0% 98%;
--muted: 240 3.7% 15.9%;
--muted-foreground: 240 5% 64.9%;

/* Market colors */
--green: 160 84% 39%;   /* Bullish */
--red: 350 89% 60%;     /* Bearish */
--amber: 38 92% 50%;    /* Warning */
--blue: 217 91% 65%;    /* Info */
```

### Typography

| Font | Usage |
|------|-------|
| **Geist Sans** | Primary UI |
| **Geist Mono** | Prices, data |
| **Space Grotesk** | Headings |

### Utilities

```css
.glass-panel    /* Glassmorphism: border + bg-black/40 + backdrop-blur */
.bg-grid-pattern /* Subtle grid background */
```

---

## Components

### shadcn/ui (60+ components)

Located in `components/ui/`. Key components:

- `button`, `card`, `dialog`, `dropdown-menu`
- `sidebar`, `dock`, `tabs`
- `tooltip`, `popover`, `sheet`
- Custom: `market-status`, `text-effect`, `text-scramble`

### Terminal Components

| Component | Location | Purpose |
|-----------|----------|---------|
| TerminalDock | `terminal/layout/` | Bottom navigation dock |
| TerminalCard | `terminal/views/terminal/` | Asset class card |
| Sparkline | `terminal/views/terminal/` | Mini price chart |
| Spotlight | `terminal/layout/spotlight/` | Command palette |

---

## Ticker Modes

The terminal supports two **visual modes**:

1. **Front Mode (Active)**
   - Tickers represent **contracts** (e.g., `ESH6`)
   - Used for drawer charts, comparisons, and spreads
   - Spotlight results show contract symbols

2. **Curve Mode (Scaffolded)**
   - Tickers represent **product roots** (e.g., `ES`)
   - Reserved for term structure/curve UI
   - Indexed in the registry but **no interaction wiring yet**

The mode is controlled globally from the **Terminal Header**.

---

## Ticker Interactions (Front Mode)

### Single Click
- Sets **primary** ticker
- Opens the drawer

### Shift+Click (Multi-Select)
- Toggles selection
- Does **not** open the drawer until 2+ tickers are selected
- When 2+ are selected, drawer opens with comparisons

### Drawer / Spotlight
- Once the drawer is open, additional symbols are added via:
  - **Add Symbol** in the toolbar
  - **Spotlight** in comparison mode

### Spread Mode (Front Mode)
- Compares the **primary** against the first comparison
- Curve-mode spreads are **TBD**

---

## Animations

Using **Framer Motion**:

- Page transitions: `AnimatePresence` with fade/scale
- Dock: Spring animation on hover reveal
- Price updates: Color flash on change

---

## Responsive

| Breakpoint | Layout |
|------------|--------|
| Mobile | Single column, stacked |
| Tablet (md) | 2 column grid |
| Desktop (lg+) | 3 column grid, dock visible |

---

## Accessibility

- Keyboard navigation via Spotlight (`Cmd+K`)
- Focus states on all interactive elements
- Color contrast WCAG AA compliant
- Semantic HTML throughout

---

## UI Standardization

Popout elements (dropdowns, tooltips, hover cards) follow a consistent style via **Radix UI** primitives.

### Standard Classes

| Property | Class |
|----------|-------|
| Background | `bg-muted` |
| Text | `text-foreground` |
| Border | `border` |
| Shadow | `shadow` |
| Radius | `rounded-md` |

### Guidelines

1. **Use Radix UI** — `HoverCard`, `Popover`, `DropdownMenu` via `src/components/ui`
2. **Match the classes** — Custom components should use standard classes above
3. **No hardcoded colors** — Use semantic tokens (`bg-background`, `bg-muted`, `bg-card`)

---

*Last updated: February 2026*
