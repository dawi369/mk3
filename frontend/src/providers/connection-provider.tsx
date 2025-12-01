"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { NEXT_PUBLIC_HUB_URL } from "@/config/env";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface ConnectionContextType {
  status: ConnectionStatus;
  send: (data: any) => void;
  subscribe: (callback: (msg: any) => void) => () => void;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<Timer | null>(null);
  const retryCountRef = useRef(0);
  const subscribersRef = useRef<Set<(msg: any) => void>>(new Set());

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    console.log(`🔌 Connecting to Hub WebSocket at ${NEXT_PUBLIC_HUB_URL}...`);

    const ws = new WebSocket(NEXT_PUBLIC_HUB_URL);
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
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
      scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setStatus("error");
      // onclose will trigger reconnect
    };
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
    connect();
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
