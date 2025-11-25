import type { MonthCode } from "@/types/common.types.js";

export const ALL_MONTHS: MonthCode[] = [
  "F", // Jan
  "G", // Feb
  "H", // Mar
  "J", // Apr
  "K", // May
  "M", // Jun
  "N", // Jul
  "Q", // Aug
  "U", // Sep
  "V", // Oct
  "X", // Nov
  "Z", // Dec
];

export const QUARTERLY_MONTHS: MonthCode[] = ["H", "M", "U", "Z"];
export const QUARTERLY_MONTHS_ALT: MonthCode[] = ["H", "N", "U", "Z"];

// Asset classes that have a standard default schedule
export const ASSET_CLASS_DEFAULTS: Record<string, MonthCode[]> = {
  us_indices: QUARTERLY_MONTHS,
  currencies: QUARTERLY_MONTHS,
  // metals, softs, grains have no default - must be defined in TICKER_SCHEDULES
};

// Specific schedules for individual tickers
// User to populate this with specific schedules for Grains, Softs, Metals, etc.
export const TICKER_SCHEDULES: Record<string, MonthCode[]> = {
  // Metals
  HG: ALL_MONTHS,
  GC: ALL_MONTHS,
  SI: ALL_MONTHS,
  PL: ["Z"],
  PA: ["Z"],
};
