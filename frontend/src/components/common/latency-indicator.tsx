"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export function LatencyIndicator() {
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<"good" | "medium" | "poor">("good");

  useEffect(() => {
    const measureLatency = async () => {
      try {
        const startTime = performance.now();

        // Replace with your actual backend server URL
        // const targetUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const targetUrl = "https://api.polygon.io";

        await fetch(targetUrl, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        });

        const endTime = performance.now();
        const latencyMs = Math.round(endTime - startTime);

        setLatency(latencyMs);

        // Set status based on latency
        if (latencyMs < 200) {
          setStatus("good");
        } else if (latencyMs < 500) {
          setStatus("medium");
        } else {
          setStatus("poor");
        }
      } catch (error) {
        setLatency(null);
      }
    };

    // Initial measurement
    measureLatency();

    // Measure every second
    const interval = setInterval(measureLatency, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "good":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "poor":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/2 backdrop-blur-md border border-white/5 shadow-sm w-[100px]">
      <Activity className={`w-4 h-4 ${getStatusColor()}`} />
      <span className="text-sm font-medium tabular-nums">
        {latency !== null ? `${latency}ms` : "--ms"}
      </span>
    </div>
  );
}
