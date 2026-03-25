import { MASSIVE_API_KEY } from "@/config/env.js";
import type {
  MassiveSnapshotContract,
  MassiveSnapshotResponse,
} from "@/types/front_month.types.js";
import type { SnapshotData } from "@/types/common.types.js";

const MASSIVE_SNAPSHOT_URL = "https://api.massive.com/futures/vX/snapshot";

export function parseSettlementDate(rawDate: string | number | null | undefined): string {
  if (typeof rawDate === "string") {
    return rawDate;
  }

  if (typeof rawDate === "number") {
    const ms = rawDate > 1e15 ? rawDate / 1_000_000 : rawDate;
    const date = new Date(ms);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]!;
    }
  }

  return "";
}

export async function fetchTickerSnapshotContract(
  ticker: string,
): Promise<MassiveSnapshotContract | null> {
  const url = `${MASSIVE_SNAPSHOT_URL}?ticker=${ticker}&apiKey=${MASSIVE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as MassiveSnapshotResponse;
    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return null;
    }

    return data.results[0] || null;
  } catch {
    return null;
  }
}

export function snapshotContractToSnapshotData(
  contract: MassiveSnapshotContract,
): SnapshotData {
  const session = contract.session || {};

  return {
    productCode: contract.details.product_code || "",
    settlementDate: parseSettlementDate(contract.details.settlement_date),
    sessionOpen: session.open || 0,
    sessionHigh: session.high || 0,
    sessionLow: session.low || 0,
    sessionClose: session.close || 0,
    settlementPrice: session.settlement_price || 0,
    prevSettlement: session.previous_settlement || 0,
    change: session.change || 0,
    changePct: session.change_percent || 0,
    openInterest: contract.open_interest || null,
    timestamp: Date.now(),
  };
}
