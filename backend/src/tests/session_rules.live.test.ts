import { describe, expect, test } from "bun:test";
import { buildGeneratedContracts } from "@/utils/contracts_calendar.js";
import { fetchTickerSnapshotContract } from "@/utils/massive_snapshots.js";
import { getSessionWindowForTimestamp } from "@/utils/market_session.js";

const runLiveTests = Bun.env.RUN_LIVE_TESTS === "1";
const DISPLAYED_ROOTS = ["ES", "YM", "GC", "CL"] as const;

describe("Live session rules", () => {
  test.skipIf(!runLiveTests)(
    "resolve active displayed contracts into valid session windows",
    async () => {
      for (const root of DISPLAYED_ROOTS) {
        const candidates = buildGeneratedContracts(root, 4);
        let resolvedTicker: string | null = null;

        for (const candidate of candidates) {
          const snapshot = await fetchTickerSnapshotContract(candidate.ticker);
          if (snapshot) {
            resolvedTicker = snapshot.details.ticker;
            break;
          }
        }

        expect(resolvedTicker).not.toBeNull();

        const session = getSessionWindowForTimestamp(
          resolvedTicker!,
          Date.now(),
        );

        expect(session).not.toBeNull();
        expect(session?.rootSymbol).toBe(root);
        expect(session?.sessionEndTime).toBeGreaterThan(
          session?.sessionStartTime ?? 0,
        );
      }
    },
    30000,
  );
});
