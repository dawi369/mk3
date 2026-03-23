import type { PolygonAssetClass } from "@/types/polygon.types.js";
import type { FrontMonthInfo } from "@/types/front_month.types.js";
import type { ActiveContract } from "@/types/contract.types.js";
import { parseSettlementDate } from "@/utils/polygon_snapshots.js";
import type { PolygonSnapshotContract } from "@/types/front_month.types.js";

export interface FrontMonthCandidate {
  contract: ActiveContract;
  snapshot: PolygonSnapshotContract | null;
}

interface RankedCandidate {
  ticker: string;
  volume: number;
  openInterest: number;
  daysToExpiry: number;
  lastPrice: number | null;
  expiryDate: string;
}

function toRankedCandidate(candidate: FrontMonthCandidate): RankedCandidate | null {
  const expiryDate =
    parseSettlementDate(candidate.snapshot?.details.settlement_date) ||
    candidate.contract.lastTradeDate;

  const expiry = expiryDate ? new Date(expiryDate) : new Date(NaN);
  const daysToExpiry = isNaN(expiry.getTime())
    ? -1
    : Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysToExpiry <= 0) {
    return null;
  }

  return {
    ticker: candidate.contract.ticker,
    volume: candidate.snapshot?.session?.volume || 0,
    openInterest: candidate.snapshot?.open_interest || 0,
    daysToExpiry,
    lastPrice:
      candidate.snapshot?.last_trade?.price ||
      candidate.snapshot?.session?.close ||
      null,
    expiryDate,
  };
}

export function resolveFrontMonth(
  candidates: FrontMonthCandidate[],
  productCode: string,
  assetClass: PolygonAssetClass,
): FrontMonthInfo | null {
  const ranked = candidates
    .map(toRankedCandidate)
    .filter((candidate): candidate is RankedCandidate => candidate !== null);

  if (ranked.length === 0) {
    return null;
  }

  const nearestExpiry = [...ranked].sort(
    (a, b) => a.daysToExpiry - b.daysToExpiry,
  )[0];

  if (!nearestExpiry) {
    return null;
  }

  const volumeRanked = [...ranked].sort((a, b) => {
    if (b.volume !== a.volume) return b.volume - a.volume;
    if (b.openInterest !== a.openInterest) return b.openInterest - a.openInterest;
    return a.daysToExpiry - b.daysToExpiry;
  });

  const liquidityLeader = volumeRanked[0] || nearestExpiry;
  const runnerUp = volumeRanked[1] || null;

  let confidence: FrontMonthInfo["confidence"] = "low";
  if (liquidityLeader.volume > 0) {
    confidence =
      !runnerUp || liquidityLeader.volume > runnerUp.volume ? "high" : "medium";
  } else if (liquidityLeader.openInterest > 0) {
    confidence = "medium";
  }

  const frontMonth =
    liquidityLeader.volume > 0 || liquidityLeader.openInterest > 0
      ? liquidityLeader
      : nearestExpiry;

  return {
    frontMonth: frontMonth.ticker,
    productCode,
    assetClass,
    volume: frontMonth.volume,
    daysToExpiry: frontMonth.daysToExpiry,
    nearestExpiry: nearestExpiry.ticker,
    isRolling: frontMonth.ticker !== nearestExpiry.ticker,
    lastPrice: frontMonth.lastPrice,
    expiryDate: frontMonth.expiryDate,
    confidence,
    candidateCount: ranked.length,
  };
}
