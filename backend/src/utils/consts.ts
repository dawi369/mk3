import type { MonthCode } from "@/types/common.types.js";

// Polygon API configuration
export const POLYGON_WS_URL = "wss://socket.polygon.io";

// Futures month codes by trading cycle
export const QUARTERLY_MONTHS: MonthCode[] = ["H", "M", "U", "Z"]; // Mar, Jun, Sep, Dec
export const ALL_MONTHS: MonthCode[] = [
  "F",
  "G",
  "H",
  "J",
  "K",
  "M",
  "N",
  "Q",
  "U",
  "V",
  "X",
  "Z",
];
