# Dashboard Architecture & Implementation Guide

## Overview

The dashboard is the core trading interface of Swordfish, designed to be modular, extensible, and high-performance. It adopts a "Nexus OS" aesthetic (dark, industrial, grid-based) and uses serverless technologies for real-time data.

## Layout Structure

The dashboard is divided into 6 main sections, corresponding to the asset classes defined in `backend/tickers`:

1.  **Currencies**
2.  **Grains**
3.  **Metals**
4.  **Softs**
5.  **US Indices**
6.  **Volatiles**

### Asset Class Section Design

Each section functions as a self-contained module:

- **Winners/Losers List**: A double-sided vertical list with a central divider.
  - **Left**: Top 3 Winners (Green)
  - **Right**: Top 3 Losers (Red)
- **Ticker Details**: To the right of the list, displaying:
  - Volume
  - Open/High/Low/Close (OHLC)
  - Net Change / % Change
- **Contract Selector**: A dropdown or toggle to switch contracts (e.g., `ESZ25` -> `ESH26`).

### Market Sentiment Area

Located prominently (likely top or side), displaying regime panels as defined in `sentiment.txt`:

- **Volatility Regime**: VIX pctile, RV breadth, Tail pressure.
- **Trend Regime**: SMA50/200 breadth, ADX.
- **Risk Appetite**: SPY/TLT, HYG/LQD, USD, Commodity Momentum.
- **Carry Regime**: Curve states (Backwardation/Contango).

### Indicators Section

A flexible area for future technical indicators (TBD).

## Technical Stack

### Data Fetching: `useRealtime` Hook

We will implement a custom `useRealtime` hook inspired by Upstash's patterns for Redis Streams.

- **Backend**: Redis Streams (via Upstash or local Redis) stores ticker updates.
- **Transport**: Server-Sent Events (SSE) or HTTP Long-polling (via Next.js API routes) to stream data to the client.
- **Validation**: Zod 4.0 schemas to validate incoming events.

#### Schema Example

```typescript
import { z } from "zod";

export const TickerUpdateSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number(),
  timestamp: z.number(),
});

export type TickerUpdate = z.infer<typeof TickerUpdateSchema>;
```

## Design System

- **Aesthetic**: Fey / Nexus OS.
- **Shared Styles**: Moved to `globals.css` (grid backgrounds, animations).
- **Fonts**: Space Grotesk (Headers), Geist Mono (Data).

## Future Features

- **Spotlight Search**: `Cmd+K` interface for quick navigation and symbol lookup.
