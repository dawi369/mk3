# Futures Trading Dashboard Cheatsheet

## 1. Core Market Groups
| Category | Common Symbols | Expiration Cycle | Notes |
|-----------|----------------|------------------|-------|
| **Currencies (FX)** | `6E` (Euro), `6B` (GBP), `6J` (JPY), `6C` (CAD), `6A` (AUD), `6N` (NZD) | Quarterly (Mar, Jun, Sep, Dec) | Follow IMM cycle. Liquidity highest in front contract. |
| **Grains** | `ZC` (Corn), `ZW` (Wheat), `ZS` (Soybeans), `ZO` (Oats), `ZM` (Soy Meal), `ZL` (Soy Oil) | Monthly/Seasonal (Mar, May, Jul, Sep, Dec) | Watch harvest cycle months for liquidity spikes. |
| **Softs** | `KC` (Coffee), `SB` (Sugar), `CC` (Cocoa), `CT` (Cotton), `OJ` (Orange Juice) | Monthly/Seasonal (Mar, May, Jul, Sep, Dec) | Each has dominant active months. |
| **Metals** | `GC` (Gold), `SI` (Silver), `HG` (Copper), `PL` (Platinum), `PA` (Palladium) | Monthly | Gold/Silver are liquid across multiple months. |
| **US Indices** | `ES` (S&P 500), `NQ` (Nasdaq 100), `YM` (Dow), `RTY` (Russell 2000) | Quarterly (Mar, Jun, Sep, Dec) | Liquidity rolls 1 week before expiry. |
| **Volatiles / Others** | `NG` (Natural Gas), `CL` (Crude Oil), `HO` (Heating Oil), `RB` (Gasoline), `LBR` (Lumber), `HE` (Lean Hogs), `LE` (Live Cattle), `GF` (Feeder Cattle) | Mostly Monthly | High volatility. Watch margin changes and roll schedules. |

---

## 2. Contract Codes
Format: `[Root][MonthCode][YearCode]`

| Month | Code |
|-------|------|
| Jan | F |
| Feb | G |
| Mar | H |
| Apr | J |
| May | K |
| Jun | M |
| Jul | N |
| Aug | Q |
| Sep | U |
| Oct | V |
| Nov | X |
| Dec | Z |

Example: `ZCZ25` = Corn, December 2025.

---

## 3. Data Model Essentials
Each contract entry should contain:
- `symbol`: e.g., `ZCZ25`
- `underlying`: e.g., `ZC`
- `asset_class`: e.g., `Grain`
- `expiration_date`: ISO format
- `first_notice_date`
- `last_trade_date`
- `contract_month`: e.g., `2025-12`
- `tick_size`
- `tick_value`
- `multiplier`
- `margin_requirement`
- `volume`
- `open_interest`
- `settlement_price`
- `previous_settlement`
- `change_percent`
- `roll_date`
- `delivery_type` (`Physical` / `Cash`)

---

## 4. Dashboard Core Features

### Data
- Auto-fetch contract metadata from CME, ICE, or other exchanges.
- Refresh live quotes at least every few seconds.
- Aggregate `volume` and `open_interest` to detect active contracts.

### Display
- Group contracts by category.
- Default to **front-month (highest volume)**.
- Allow toggling between nearby months.
- Color or tag front and next month contracts.
- Include charting (candlestick or OHLC) for each underlying continuous contract.
- Show spread between months (calendar spread).

### Roll Logic
1. Identify front month (`highest volume` or `nearest expiry > today`).
2. Define roll threshold (e.g., 5 trading days before expiration).
3. On roll date:
   - Transition default display to next month.
   - Use continuous contract index to link history.

### Metrics to Display
- `Last`, `Change`, `%Change`
- `Volume`, `Open Interest`
- `Bid`, `Ask`, `Spread`
- `High`, `Low`, `Settlement`
- `Implied Volatility` (if available)
- `Basis` (for physical commodities)
- `Term Structure` visualization for selected underlying.

---

## 5. What Traders Care About
- Liquidity: visible `volume` and `open_interest`.
- Tight bid/ask spread.
- Clear roll schedule and expiration dates.
- Margin impact and contract value (`price * multiplier`).
- Continuous historical chart for technical analysis.
- Seasonality view (grains, softs, energy).
- Calendar spreads (e.g., `CLZ25 - CLF26`).
- Volatility overlay for energy and metals.
- Basis or futures-spot spread (for physicals).
- Clear symbol mapping for brokerage feeds.

---

## 6. API Integration
- Use data from: CME Group API, Polygon.io, Quandl (CME dataset), Barchart, or Refinitiv.
- Cache daily metadata (contract list, expirations, tick values).
- Re-fetch real-time quotes via WebSocket or REST stream.

---

## 7. Contract Selection Logic
Example pseudocode:
```
for each underlying in asset_list:
contracts = get_contracts(underlying)
front = max(contracts, key=lambda c: c.volume)
next = next_highest_volume(contracts)
display(front, next)
```


Optional filters:
- `open_interest > 1000`
- `expiration_date - today > 10 days`

---

## 8. Continuous Contract Construction
To build continuous historical series:
1. Collect price data for each expiry.
2. On roll date, link next contract with price adjustment (`back-adjusted`).
3. Provide both:
   - `Non-adjusted continuous` (true price path)
   - `Back-adjusted continuous` (for smooth charting)

---

## 9. UI/UX Priorities
- Fast load and update (low latency quotes).
- Keyboard shortcuts for switching underlyings.
- Dynamic watchlists grouped by category.
- Visual indicators for nearing expiration.
- Option to show `spread` or `calendar` trades.
- Compact but data-dense layout (no fluff).

---

## 10. Testing Checklist
- Verify correct expiration cycle for each asset class.
- Validate active contract detection (matches CME volume ranking).
- Confirm rollover logic and date accuracy.
- Ensure correct tick and multiplier math for PnL.
- Test for stale data and broken contract codes.
- Monitor for contract delisting and new listings.

---

## 11. References (High Credibility)
- CME Group Product Specs (10/10)
- ICE Futures Contract Specs (10/10)
- CFTC Market Reports (8/10)
- Barchart Continuous Futures Methodology (7/10)
- Investopedia Futures Contract Details (6/10)

---

**End of Cheatsheet**
