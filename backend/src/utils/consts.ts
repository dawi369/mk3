import type { MonthCode, PolygonWsRequest } from "./types.js";
import { quarterlyBuilder } from "@/utils/cbs/quarterly_cb.js";
import { SUBSCRIPTION_CONFIG } from "@/config/subscriptions.js";

// Polygon API configuration
export const POLYGON_WS_URL = 'wss://socket.polygon.io';

// Futures month codes by trading cycle
export const QUARTERLY_MONTHS: MonthCode[] = ['H', 'M', 'U', 'Z']; // Mar, Jun, Sep, Dec
export const ALL_MONTHS: MonthCode[] = [
  'F',
  'G',
  'H',
  'J',
  'K',
  'M',
  'N',
  'Q',
  'U',
  'V',
  'X',
  'Z',
];

// Pre-built subscription requests for US indices
export const futuresUSIndicesSecondsRequest: PolygonWsRequest =
  quarterlyBuilder.buildQuarterlyRequest(
    "us_indices",
    "A",
    SUBSCRIPTION_CONFIG.US_INDICES_QUARTERS
  );

export const futuresUSIndicesMinutesRequest: PolygonWsRequest =
  quarterlyBuilder.buildQuarterlyRequest(
    "us_indices",
    "AM",
    SUBSCRIPTION_CONFIG.US_INDICES_QUARTERS
  );

// Pre-built subscription requests for metals
export const futuresMetalsSecondsRequests: PolygonWsRequest =
  quarterlyBuilder.buildQuarterlyRequest(
    "metals",
    "A",
    SUBSCRIPTION_CONFIG.METALS_QUARTERS
  );

export const futuresMetalsMinutesRequests: PolygonWsRequest =
  quarterlyBuilder.buildQuarterlyRequest(
    "metals",
    "AM",
    SUBSCRIPTION_CONFIG.METALS_QUARTERS
  );