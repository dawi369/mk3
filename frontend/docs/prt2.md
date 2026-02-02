# Component Specification: TickerEntry (v2.0)

## 1. Overview
* **Role:** Displays real-time session data for a single futures contract.
* **Data Source:** Expects a **Session Snapshot Object**, not a raw 1-second bar.
* **Framework:** React + Shadcn UI + Tailwind CSS.
* **Performance:** Uses `React.memo` to limit re-renders. Updates should be efficient (e.g., CSS flashing for price changes).

---

## 2. Visual Architecture

### A. Dimensions & Base Style
* **Dimensions:** `h-[90px]` x `w-full` (Responsive Grid Cell).
* **Background:** `bg-card` (Level 2 Depth, e.g., `#1E1E1E`).
* **Border:** `border border-border/10` (Subtle).
* **Radius:** `rounded-sm` (4px) or `rounded-md` (6px) — *Must match Sector Containers*.
* **Hover:** `hover:bg-accent/5` or brightness up.
* **Interaction:** `cursor-pointer` (Opens Chart Modal).

### B. Layout (The Grid)
Split into two zones using Flexbox:
1.  **Data Cluster (Left 85%):** The numerical data.
2.  **Pulse Bar (Right 15%):** The visual trend indicator.

---

## 3. Data Zone Specification (Left 85%)

**Typography:**
* **Numbers:** `font-mono` (JetBrains Mono), `tabular-nums`.
* **Text:** `font-sans` (Roboto/Inter), `font-bold` for Symbol.

### Row 1: Identity
* **Symbol:** `text-lg font-bold text-foreground` (e.g., "ES").
* **Expiry:** `text-xs font-mono text-muted-foreground` (e.g., "H6").

### Row 2: Price Action (The Hero)
* **Last Price:** `text-2xl font-bold font-mono text-foreground`.
    * **Logic:** Displays `snapshot.last_price`.
    * **Flash:** Text turns `text-white` (brightness 150%) briefly on update.
* **Net Change:** `text-sm font-mono`.
    * **Calculation:** `last_price` - `prev_close`.
    * **Color:** `text-emerald-500` if positive, `text-rose-500` if negative.

### Row 3: Liquidity
* **Volume:** `text-xs font-mono text-muted-foreground/50`.
    * **Display:** `snapshot.cum_volume` (Cumulative Session Volume).
    * **Format:** Compact (e.g., "1.2M", "500k").
* **VWAP:** `text-xs font-mono text-amber-500/80` (Optional).

---

## 4. Pulse Bar Specification (Right 15%)

A vertical visualizer representing the **Session Range**.

### The Container
* `h-full w-3 ml-auto flex items-center justify-center relative`.

### The Visual Elements
1.  **The Track (Range):**
    * **Height:** 100% of container.
    * **Meaning:** Top = `snapshot.session_high`, Bottom = `snapshot.session_low`.
    * **Style:** `w-[1px] bg-border/20`.
2.  **The Reference (Gap Marker):**
    * **Position:** Maps `snapshot.prev_close` relative to High/Low.
    * **Style:** Horizontal tick `w-full h-[1px] bg-muted-foreground`.
    * **Edge Case:** If `prev_close` is outside the High/Low range, clamp to top/bottom and add `bg-amber-500` to indicate "Gap Out".
3.  **The Body (Candle):**
    * **Top:** `Max(snapshot.session_open, snapshot.last_price)`.
    * **Bottom:** `Min(snapshot.session_open, snapshot.last_price)`.
    * **Color:** `bg-emerald-500` (if Last > Open), `bg-rose-500` (if Last < Open).
    * **Style:** `w-2 rounded-[1px]`.

---

## 5. React Interface

```typescript
interface TickerSnapshot {
  symbol: string;        // "ESH6"
  last_price: number;    // 7011.00
  session_open: number;  // 7000.00
  session_high: number;  // 7015.00
  session_low: number;   // 6995.00
  prev_close: number;    // 6980.00 (Static from yesterday)
  cum_volume: number;    // 50240 (Aggregated)
}