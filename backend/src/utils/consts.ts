import type { MassiveAssetClass } from "@/types/massive.types.js";

export const MASSIVE_WS_URL = "wss://socket.massive.com";
export const MASSIVE_CONTRACTS_URL = "https://api.massive.com/futures/vX/contracts";

export const MASSIVE_ASSET_CLASS_LIST: readonly MassiveAssetClass[] = [
  "us_indices",
  "metals",
  "currencies",
  "grains",
  "softs",
  "volatiles",
] as const;

export const MAX_PAGES_PER_TICKER = 200;
export const MAX_UNIQUE_CONTRACTS = 10;
