import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface MarketData {
  type: string;
  id: string;
  data: any;
  timestamp: number;
}

export function AiLabView() {
  const [messages, setMessages] = useState<MarketData[]>([]);
  const [status, setStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const connect = () => {
      setStatus("connecting");
      const ws = new WebSocket("ws://localhost:3001");
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        console.log("Connected to WS Proxy");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          // Add timestamp for display
          const messageWithTime = { ...payload, timestamp: Date.now() };

          setMessages((prev) => {
            const newMessages = [messageWithTime, ...prev];
            return newMessages.slice(0, 100); // Keep last 100 messages
          });
        } catch (e) {
          console.error("Failed to parse message", e);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        console.log("Disconnected from WS Proxy");
        // Reconnect after 2s
        setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("WS Error", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Lab / Data Stream</h1>
          <p className="text-muted-foreground text-sm">
            Real-time feed from Redis Stream via WebSocket Proxy
          </p>
        </div>
        <Badge variant={status === "connected" ? "default" : "destructive"}>
          {status.toUpperCase()}
        </Badge>
      </header>

      <Card className="flex-1 overflow-hidden bg-black/50 border-zinc-800">
        <ScrollArea className="h-full p-4">
          <div className="space-y-2 font-mono text-xs">
            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className="flex gap-4 p-2 hover:bg-white/5 rounded transition-colors border-b border-white/5 last:border-0"
              >
                <span className="text-zinc-500 w-24 shrink-0">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-blue-400 w-20 shrink-0">{msg.type}</span>
                <span className="text-zinc-300 break-all">{JSON.stringify(msg.data)}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 py-12">Waiting for data...</div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
