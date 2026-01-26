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

*Last updated: January 2026*
