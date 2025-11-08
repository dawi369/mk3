import type { PolygonWsRequest } from "@/utils/types.js";
import { usIndicesBuilder } from "./contract_builder.js";

export const POLYGON_WS_URL = "wss://socket.polygon.io";

// Dynamic US indices contracts (current quarter + 3 future quarters)
export const futuresUSIndicesSecondRequest: PolygonWsRequest = usIndicesBuilder.buildQuarterlyRequest('A', 1);
export const futuresUSIndicesMinuteRequest: PolygonWsRequest = usIndicesBuilder.buildQuarterlyRequest('AM', 1);
