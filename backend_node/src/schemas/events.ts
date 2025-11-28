import { z } from "zod";

// Polygon Aggregate Event (A)
export const PolygonAggregateEventSchema = z.object({
  ev: z.literal("A"),
  sym: z.string(),
  v: z.number(),
  dv: z.number(),
  n: z.number(),
  o: z.number(),
  c: z.number(),
  h: z.number(),
  l: z.number(),
  s: z.number(),
  e: z.number(),
});

export type PolygonAggregateEvent = z.infer<typeof PolygonAggregateEventSchema>;

// Normalized Bar Schema
export const BarSchema = z.object({
  symbol: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  trades: z.number(),
  dollarVolume: z.number().optional(),
  startTime: z.number(),
  endTime: z.number(),
});

export type Bar = z.infer<typeof BarSchema>;
