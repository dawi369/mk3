# Candle Mini-Chart (Ticker Entry)

This note explains the small candle-style visualization shown on the right side of each ticker entry.

## What you are seeing
- Track: the thin vertical line shows the full session range from low (bottom) to high (top).
- Body: the thicker colored bar shows the move from session open to current last price.
  - Green means last price is above open.
  - Red means last price is below open.
- Current price marker: the thin glowing horizontal line shows the latest traded price.
- Previous close line: the subtle horizontal line shows the prior session close for context.

## How it is computed
- session_high and session_low define the range for the track.
- session_open and last_price define the body.
- prev_close defines the reference line.
- Values are clamped to the session range so the visual remains stable even if data is noisy or incomplete.

## Design goals
- Immediate read of direction (body color) and position within the session (body + marker).
- Consistent alignment with the rest of the ticker entry layout.
- Minimal noise: only key context lines, no extra caps or badges.
