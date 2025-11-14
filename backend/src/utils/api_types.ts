// Purpose: Type definitions for WebSocket server

import type { WebSocket } from "ws";
import type { Bar } from "@/utils/general_types.js";

/**
 * Client connection tracking
 */
export interface ClientConnection {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>; // Symbol subscriptions, ['*'] = all
  delaySeconds: number; // Time delay (0 = real-time)
  lastSentTimestamp: number; // Last bar timestamp sent (for delayed clients)
  connectedAt: number;
  lastHeartbeat: number;
  isAlive: boolean;
  metadata: ClientMetadata;
}

/**
 * Client metadata (auth-ready)
 */
export interface ClientMetadata {
  ipAddress: string;
  userAgent?: string;
  authToken?: string; // For future auth
  userId?: string; // For future auth
  permissions?: string[]; // For future RBAC
}

/**
 * Client → Server messages
 */
export type ClientMessage =
  | { action: "subscribe"; symbols: string[] }
  | { action: "unsubscribe"; symbols: string[] }
  | { action: "setDelay"; delaySeconds: number }
  | { action: "pong" };

/**
 * Server → Client messages
 */
export type ServerMessage =
  | { type: "bar"; data: Bar }
  | { type: "subscribed"; symbols: string[] }
  | { type: "unsubscribed"; symbols: string[] }
  | { type: "delaySet"; delaySeconds: number }
  | {
      type: "snapshot";
      symbols: Record<string, Bar>;
      delaySeconds: number;
      snapshotTime: number;
    }
  | { type: "error"; message: string }
  | { type: "ping" }
  | { type: "welcome"; clientId: string; serverTime: number };

export const delayTime = {
  zero: 0,
  fifteenMinutes: 900,
} as const;
