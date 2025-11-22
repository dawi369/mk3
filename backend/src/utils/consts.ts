import type { PolygonWsRequest } from "@/types/polygon.types.js";
import type { MonthCode } from "@/types/common.types.js";
import { quarterlyBuilder } from "@/utils/cbs/quarterly_cb.js";
import { monthlyBuilder } from "@/utils/cbs/monthly_cb.js";
import { SUBSCRIPTION_CONFIG } from "@/config/subscriptions.js";

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
export const futuresMetalsSecondsRequest: PolygonWsRequest =
  quarterlyBuilder.buildQuarterlyRequest(
    "metals",
    "A",
    SUBSCRIPTION_CONFIG.METALS_QUARTERS
  );

export const futuresMetalsMinutesRequest: PolygonWsRequest =
  quarterlyBuilder.buildQuarterlyRequest(
    "metals",
    "AM",
    SUBSCRIPTION_CONFIG.METALS_QUARTERS
  );

// Pre-built subscription requests for currency
export const futuresCurrencySecondsRequest: PolygonWsRequest =
  quarterlyBuilder.buildQuarterlyRequest(
    "currencies",
    "A",
    SUBSCRIPTION_CONFIG.CURRENCY_QUARTERS
  );

export const futuresCurrencyMinutesRequest: PolygonWsRequest =
  quarterlyBuilder.buildQuarterlyRequest(
    "currencies",
    "AM",
    SUBSCRIPTION_CONFIG.CURRENCY_QUARTERS
  );

// Pre-built subscription requests for grains
export const futuresGrainsSecondsRequest: PolygonWsRequest =
  monthlyBuilder.buildMonthlyRequest(
    "grains",
    "A",
    SUBSCRIPTION_CONFIG.GRAINS_MONTHS
  );

export const futuresGrainsMinutesRequest: PolygonWsRequest =
  monthlyBuilder.buildMonthlyRequest(
    "grains",
    "AM",
    SUBSCRIPTION_CONFIG.GRAINS_MONTHS
  );

// Pre-built subscription requests for softs
export const futuresSoftsSecondsRequest: PolygonWsRequest =
  monthlyBuilder.buildMonthlyRequest(
    "softs",
    "A",
    SUBSCRIPTION_CONFIG.SOFTS_MONTHS
  );

export const futuresSoftsMinutesRequest: PolygonWsRequest =
  monthlyBuilder.buildMonthlyRequest(
    "softs",
    "AM",
    SUBSCRIPTION_CONFIG.SOFTS_MONTHS
  );

// Pre-built subscription requests for volatiles
export const futuresVolatilesSecondsRequest: PolygonWsRequest =
  monthlyBuilder.buildMonthlyRequest(
    "volatiles",
    "A",
    SUBSCRIPTION_CONFIG.VOLATILES_MONTHS
  );

export const futuresVolatilesMinutesRequest: PolygonWsRequest =
  monthlyBuilder.buildMonthlyRequest(
    "volatiles",
    "AM",
    SUBSCRIPTION_CONFIG.VOLATILES_MONTHS
  );
