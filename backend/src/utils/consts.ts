import type { PolygonAssetClass } from "@/types/polygon.types.js";

export const POLYGON_WS_URL = "wss://socket.polygon.io";
export const POLYGON_CONTRACTS_URL =
  "https://api.massive.com/futures/vX/contracts";

export const POLYGON_ASSET_CLASS_LIST: readonly PolygonAssetClass[] = [
  "us_indices",
  "metals",
  "currencies",
  "grains",
  "softs",
  "volatiles",
] as const;
