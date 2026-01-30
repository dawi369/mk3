# High-Performance Futures Terminal – UI/UX Design Spec v2.0

## 1. Project Philosophy
* **Goal:** A latency-sensitive, high-density quote board for active futures traders.
* **Aesthetic:** "Bloomberg Modern." Zero clutter, high contrast, strict data visualization.
* **Performance:**
    * **Zero Layout Shift:** Use fixed CSS Grid/Flexbox.
    * **In-Place Updates:** React components should update value references, not trigger full DOM rewrites.
    * **Network Efficient:** Frontend must match the specific Redis/WebSocket struct designed for the backend.

---

## 2. Visual Design System
**Dev Note:** Do not hardcode hex values. Use the CSS variables defined in `globals.css`.

### A. Color Palette (Intent Mapping)
* **Depth (Layered UI):**
    * `var(--bg-app)`: Main background (Deepest).
    * `var(--bg-panel)`: Sector Containers (Level 1).
    * `var(--bg-card)`: Atomic Ticker Cells (Level 2).
    * `var(--bg-card-hover)`: Interaction state (Level 3).
* **Signal Colors:**
    * `var(--color-up)` / `var(--color-down)`: Price direction and Pulse Bar fills.
    * `var(--text-flash)`: Bright white for price updates.
* **Typography:**
    * **Numbers/Data:** `JetBrains Mono` (Use tabular nums `font-variant-numeric: tabular-nums`).
    * **UI/Labels:** `Roboto`.

---

## 3. Data Architecture (Critical)
* **Source:** WebSocket stream feeding from the optimized Redis backend.
* **Payload Handling:**
    * **Strict Adherence:** Parse the payload exactly as the Redis struct dictates.
    * **Batching:** Handle batched updates (array of tickers) efficiently.
    * **Throttling:** *Disabled* (Client handles full speed updates, max 1/sec per ticker is guaranteed upstream).

---

## 4. Layout Architecture & Headers

### A. The Global Header (App Level)
* **Location:** Top of Viewport.
* **Controls:**
    1.  **View Mode Toggle:** `[ FRONT ]` (Default) vs `[ CURVE ]`.
    2.  **Layout Lock:** `[ LOCK / EDIT ]` Toggle.
        * *Unlock:* Allows dragging Sector Containers to reorder them.

### B. The Sector Containers (The 6 Zones)
* **Grid:** Fixed 2 Row x 3 Column grid (Indices, Metals, Grains, Currencies, Volatilities, Softs).
* **Container Header:**
    * **Left:** Sector Title (e.g., "GRAINS").
    * **Right:** **Sector Summary Metric** (e.g., Avg % Change of top tickers).
    * **Right (Curve Mode Only):** Pagination Arrows `< Month >` for changing expiry.
* **Container Body:**
    * **Layout:** Fluid Grid of **Atomic Quote Cells**.
    * **Sorting:**
        * *Default:* Sort by Volume (Descending).
        * *Auto-Promotion:* If a "hidden" ticker spikes in volume, it auto-swaps into the visible Top N list.
    * **Footer:** Status bar showing `+ X Others` (Reserve count).

---

## 5. The Atomic Quote Cell (Component Spec)

**Dimensions:** Responsive (~200px width x ~90px height).
**Interaction:** Click triggers existing "Chart Modal".

### Zone 1: Data Area (Left ~85%)
| Position | Data Point | Font | Logic |
| :--- | :--- | :--- | :--- |
| **Top Left** | **Symbol** | `Roboto` Bold | e.g., "ES" |
| **Top Right** | **Expiry** | `Mono` Dimmed | e.g., "Z4" |
| **Center** | **Price** | `Mono` Large | **Flash Logic:** Text flashes White on update. |
| **Center Right** | **Change** | `Mono` Medium | Color (`--color-up`/`--color-down`). |
| **Bottom Left** | **Volume** | `Mono` Muted | e.g., "1.2M". |
| **Bottom Right** | **VWAP** | `Mono` Accent | Optional context. |

### Zone 2: The "Pulse Bar" (Right ~15%)
A vertical visual indicator of the Day's Range and Trend.

1.  **The Track (Background Line):**
    * Top = **Day High**
    * Bottom = **Day Low**
2.  **The Body (Thick Bar):**
    * **Start Point:** Today's Open.
    * **End Point:** Current Price.
    * **Color:** Green if Price > Open, Red if Price < Open.
    * *Result:* visually represents the "Candle Body" for the day.
3.  **The Wick:**
    * Thin line connecting the Body to the High/Low limits.
4.  **Reference Marker (Yesterday's Close):**
    * A static horizontal tick mark on the track.
    * *Edge Case:* If Gap > Range, clamp marker to top/bottom edge with a visual indicator (e.g., arrow).

---

## 6. View Logic States

### State A: Front Contracts (Volume View)
* **Display:** Top N tickers per sector by volume.
* **Goal:** Maximum market breadth. "What is active right now?"

### State B: Curve View (Term Structure)
* **Trigger:** User toggles "Curve" in Global Header.
* **Interaction:**
    1. User clicks a specific ticker (e.g., `Corn`) in the Grains sector.
    2. The Grains container clears and renders **Only Corn Contracts**.
    3. **Sorting:** By Expiration (Front -> Back).
    4. **Navigation:** User clicks `<` or `>` in the **Sector Header** to shift the displayed months (e.g., viewing 2026 contracts).