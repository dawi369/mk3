"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NEXT_PUBLIC_HUB_URL } from "@/config/env";
import { HubClient } from "@/lib/hub/client";
import type { HubConnectionStatus, HubMessage } from "@/types/hub.types";

interface ConnectionContextType {
  status: HubConnectionStatus;
  lastMessageAt: number | null;
  lastError: string | null;
  send: (data: unknown) => boolean;
  reconnect: () => void;
  subscribe: (callback: (msg: HubMessage) => void) => () => void;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientRef = useRef<HubClient | null>(null);
  const [status, setStatus] = useState<HubConnectionStatus>("disconnected");
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const client = new HubClient(NEXT_PUBLIC_HUB_URL);
    clientRef.current = client;

    const unsubscribeStatus = client.onStatusChange((nextStatus, details) => {
      setStatus(nextStatus);
      setLastMessageAt(details.lastMessageAt);
      setLastError(details.error?.message ?? null);
    });

    queueMicrotask(() => client.connect());

    const handleOnline = () => {
      client.reconnect();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
      unsubscribeStatus();
      client.disconnect();
      clientRef.current = null;
    };
  }, []);

  const value = useMemo<ConnectionContextType>(
    () => ({
      status,
      lastMessageAt,
      lastError,
      send: (data) => clientRef.current?.send(data) ?? false,
      reconnect: () => clientRef.current?.reconnect(),
      subscribe: (callback) => clientRef.current?.subscribe(callback) ?? (() => {}),
    }),
    [lastError, lastMessageAt, status],
  );

  return (
    <ConnectionContext.Provider value={value}>
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
