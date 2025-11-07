import type { PolygonWsRequest } from "@/utils/types.js";

export const POLYGON_WS_URL = "wss://socket.polygon.io";

export const futuresMinuteRequest: PolygonWsRequest = {
  ev: "AM",
  symbols: ["SIZ5", "GCZ5", "ESZ5", "NQZ5"],
};

export const futuresSecondRequest: PolygonWsRequest = {
  ev: "A",
  symbols: ["SIZ5", "GCZ5", "ESZ5", "NQZ5"],
};
