import { z } from "zod";

// Massive Aggregate Event (A)
export const MassiveAggregateEventSchema = z.object({
  ev: z.literal("A"),
  sym: z.string(),
  v: z.coerce.number(),
  dv: z.coerce.number(),
  n: z.coerce.number(),
  o: z.coerce.number(),
  c: z.coerce.number(),
  h: z.coerce.number(),
  l: z.coerce.number(),
  s: z.coerce.number(),
  e: z.coerce.number(),
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
