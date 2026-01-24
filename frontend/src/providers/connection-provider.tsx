"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { NEXT_PUBLIC_HUB_URL } from "@/config/env";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface ConnectionContextType {
  status: ConnectionStatus;
  send: (data: any) => void;
  subscribe: (callback: (msg: any) => void) => () => void;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

/**
 * Convert HTTP(S) URL to WebSocket URL (WS/WSS)
 * This allows using the same env var for both REST and WebSocket connections
 */
function toWebSocketUrl(url: string): string {
  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    return url; // Already a WebSocket URL
  }
  if (url.startsWith("https://")) {
    return url.replace("https://", "wss://");
  }
  if (url.startsWith("http://")) {
    return url.replace("http://", "ws://");
  }
  // Assume ws:// if no protocol specified
  console.warn(
    `[ConnectionProvider] No protocol in HUB_URL "${url}", assuming ws://`,
  );
  return `ws://${url}`;
}

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<Timer | null>(null);
  const retryCountRef = useRef(0);
  const subscribersRef = useRef<Set<(msg: any) => void>>(new Set());

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = toWebSocketUrl(NEXT_PUBLIC_HUB_URL);
    setStatus("connecting");
    console.log(`🔌 Connecting to Hub WebSocket at ${wsUrl}...`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        retryCountRef.current = 0;
        console.log("✅ Connected to Hub WebSocket");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Dispatch to all subscribers
          subscribersRef.current.forEach((callback) => callback(data));
        } catch (err) {
          console.error(
            "❌ [ConnectionProvider] Failed to parse WS message:",
            err,
          );
        }
      };

      ws.onclose = (event) => {
        setStatus("disconnected");
        wsRef.current = null;
        console.warn(
          `⚠️ [ConnectionProvider] WebSocket closed (code: ${event.code}, reason: ${event.reason || "none"})`,
        );
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        console.error("❌ [ConnectionProvider] WebSocket error:", {
          url: wsUrl,
          error: err,
          hint: "Check if the backend is running and the HUB_URL is correct",
        });
        setStatus("error");
        // onclose will trigger reconnect
      };
    } catch (err) {
      console.error("❌ [ConnectionProvider] Failed to create WebSocket:", {
        url: wsUrl,
        originalUrl: NEXT_PUBLIC_HUB_URL,
        error: err,
      });
      setStatus("error");
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return;

    const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
    console.log(`🔌 Reconnecting in ${delay}ms...`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      retryCountRef.current++;
      connect();
    }, delay);
  };

  useEffect(() => {
    // Defer to avoid synchronous setState in effect body
    queueMicrotask(() => connect());
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("Cannot send message: WebSocket not connected");
    }
  };

  const subscribe = (callback: (msg: any) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  };

  return (
    <ConnectionContext.Provider value={{ status, send, subscribe }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
};
