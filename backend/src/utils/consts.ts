import type { MonthCode, PolygonWsRequest } from "./types.js";
import { usIndicesBuilder } from "@/utils/cbs/us_indices_cb.js";

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

// Pre-built subscription requests for US indices
export const futuresUSIndicesSecondRequest: PolygonWsRequest =
  usIndicesBuilder.buildQuarterlyRequest("A", 1);

export const futuresUSIndicesMinuteRequest: PolygonWsRequest =
  usIndicesBuilder.buildQuarterlyRequest("AM", 1);
