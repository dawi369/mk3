import type { Bar } from "@/types/common.types";
import type { SessionData, SnapshotData } from "@/types/redis.types";

export type HubConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface HubInfoMessage {
  type: "info";
  message: string;
}

export interface HubMarketDataMessage {
  type: "market_data";
  data: Bar;
  snapshot?: boolean;
  id?: string;
}

export type HubMessage = HubInfoMessage | HubMarketDataMessage;

export interface HubBootstrapData {
  frontSymbols: string[];
  curveSymbols: string[];
  snapshots: Record<string, SnapshotData>;
  sessions: Record<string, SessionData>;
}
