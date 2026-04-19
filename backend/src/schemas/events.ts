import { z } from "zod";

// Massive Aggregate Event (A)
export const MassiveAggregateEventSchema = z.object({
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

export type MassiveAggregateEvent = z.infer<typeof MassiveAggregateEventSchema>;

// Normalized Bar Schema (for validation)
// NOTE: For the Bar type, use @/types/common.types.ts
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
