"use client";

import { useEffect, useState } from "react";

function formatTimezoneOffset(date: Date): string {
  const offset = date.getTimezoneOffset();
  const hours = Math.abs(Math.floor(offset / 60));
  const minutes = Math.abs(offset % 60);
  const sign = offset <= 0 ? "+" : "-";
  return `UTC${sign}${hours}${minutes ? `:${minutes.toString().padStart(2, "0")}` : ""}`;
}

function getTimezoneName(date: Date): string {
  const parts = Intl.DateTimeFormat("en-US", {
    timeZoneName: "short",
  }).formatToParts(date);
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

export function ChartTimeDisplay() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setTime(new Date());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <div className="h-6" />;

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const tzName = getTimezoneName(time);
  const tzOffset = formatTimezoneOffset(time);

  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
      <span className="text-foreground">{hours}:{minutes}:{seconds}</span>
      <span>{tzName} ({tzOffset})</span>
    </div>
  );
}
