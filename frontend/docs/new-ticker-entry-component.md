# Component Specification: TickerEntry

## 1. Component Overview
* **Role:** The atomic building block of the terminal. Represents a single futures contract.
* **Framework:** React + Shadcn UI (`Card` base).
* **Performance Constraint:** Must use `React.memo` to prevent re-renders unless data changes. Visual updates (flashing) should ideally occur via CSS transitions or ref-based direct manipulation to avoid full React render cycles if high-frequency.

---

## 2. Visual Architecture

### A. Dimensions & Base Style
* **Height:** Fixed `h-[90px]` (approx, or flexible based on grid).
* **Width:** Fluid `w-full` (fills the grid cell).
* **Background:** `bg-card` (Level 2 depth). (Lighter then what sector-container uses)
* **Border:** `border border-border/10` (Subtle).
* **Radius:** `rounded-sm` (4px) or `rounded-md` (6px) — *Must match Sector Container radius*. (whatever sector container has)
* **Hover State:** `hover:bg-accent/5` or brightness filter.
* **Cursor:**
    * *Front Mode:* `cursor-pointer` (triggers Chart).
    * *Curve Mode:* `cursor-zoom-in` (triggers Drill Down - *if applicable based on final logic*). (Right now, we only have the logic to open the chart, no drill down/curve logic yet)

### B. Layout Structure (Grid)
The component is split into two distinct zones using CSS Flexbox or Grid.

* **Zone 1: Data Cluster (Left 85%)**
    * Contains Symbol, Price, Metadata.
    * Layout: 3 Rows x 2 Columns.
* **Zone 2: Pulse Bar (Right 15%)**
    * Contains the vertical visualizer.
    * Layout: Absolute right alignment or flex item.

---

## 3. Data Zone Specification (Zone 1)

**Typography:**
* **Numbers:** `font-mono` (JetBrains Mono), `tabular-nums`, `tracking-tight`.
* **Labels:** `font-sans` (Roboto).

**Row 1: Identity**
* **Left (Symbol):**
    * Text: `ES`
    * Style: `text-foreground`, `font-bold`, `text-lg`.
* **Right (Expiry):**
    * Text: `Z4`
    * Style: `text-muted-foreground`, `font-mono`, `text-xs`.

**Row 2: Price Action (The Hero)**
* **Left (Last Price):**
    * Text: `4,550.25`
    * Style: `text-2xl`, `font-bold`, `font-mono`, `text-foreground`.
    * **Animation:** Text color flashes `text-white` (brightness 150%) on update.
* **Right (Net Change):**
    * Text: `+12.50`
    * Style: `text-sm`, `font-mono`.
    * **Color Logic:**
        * Positive: `text-emerald-500` (or `var(--color-up)`).
        * Negative: `text-rose-500` (or `var(--color-down)`).

**Row 3: Context**
* **Left (Volume):**
    * Text: `1.2M`
    * Style: `text-xs`, `text-muted-foreground/50`, `font-mono`.
* **Right (Metric/VWAP):**
    * Text: `4548.0` (Optional)
    * Style: `text-xs`, `text-amber-500/80`, `font-mono`.

---

## 4. Pulse Bar Specification (Zone 2)

A custom SVG or `div` stack representing the session structure.

* **Container:** `h-full`, `w-3` (approx 12px), `ml-auto` (Right aligned).
* **The Track (Range):**
    * Represents: `Day High` (Top) to `Day Low` (Bottom).
    * Style: Thin vertical line `w-[1px] bg-border/30` centered in container.
* **The Reference (Prev Close):**
    * Represents: Yesterday's Settlement.
    * Style: Horizontal tick mark `w-full h-[1px] bg-muted-foreground`.
* **The Candle Body (Open vs Current):**
    * **Top:** `Max(Open, Current)`
    * **Bottom:** `Min(Open, Current)`
    * **Style:** Filled Rectangle `w-2 rounded-sm`.
    * **Color:**
        * If `Current > Open`: `bg-emerald-500` (Green).
        * If `Current < Open`: `bg-rose-500` (Red).
* **The Wick:**
    * The Track line essentially acts as the wick extending from the body to the High/Low.

---

## 5. Interaction & State

### Shadcn Implementation Hint
Use the `Card` component as a wrapper, but strip the padding for maximum density.

```tsx
import { Card } from "@/components/ui/card"

export function TickerEntry({ data, onClick }) {
  // Memoized derived state for colors/positions
  return (
    <Card 
      className="relative flex h-[90px] w-full overflow-hidden rounded-sm border-border/10 bg-card p-2 hover:bg-accent/5 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Zone 1: Data */}
      <div className="flex-1 flex flex-col justify-between">
         {/* ... Row 1, 2, 3 ... */}
      </div>

      {/* Zone 2: Pulse Bar */}
      <div className="w-4 h-full relative ml-2">
         {/* ... SVG or Divs for Range/Body ... */}
      </div>
    </Card>
  )
}