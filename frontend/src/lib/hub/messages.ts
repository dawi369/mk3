import type { Bar } from "@/types/common.types";
import type { HubMessage } from "@/types/hub.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isBar(value: unknown): value is Bar {
  if (!isRecord(value)) return false;

  return (
    typeof value.symbol === "string" &&
    isFiniteNumber(value.open) &&
    isFiniteNumber(value.high) &&
    isFiniteNumber(value.low) &&
    isFiniteNumber(value.close) &&
    isFiniteNumber(value.volume) &&
    isFiniteNumber(value.trades) &&
    isFiniteNumber(value.startTime) &&
    isFiniteNumber(value.endTime)
  );
}

export function parseHubMessage(value: unknown): HubMessage | null {
  if (!isRecord(value) || typeof value.type !== "string") {
    return null;
  }

  if (value.type === "info" && typeof value.message === "string") {
    return { type: "info", message: value.message };
  }

  if (value.type === "market_data" && isBar(value.data)) {
    return {
      type: "market_data",
      data: value.data,
      snapshot: value.snapshot === true,
      id: typeof value.id === "string" ? value.id : undefined,
    };
  }

  return null;
}

export function parseHubMessageEvent(event: MessageEvent<string>): HubMessage | null {
  try {
    return parseHubMessage(JSON.parse(event.data));
  } catch {
    return null;
  }
}
