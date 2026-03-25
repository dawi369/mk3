import { describe, expect, test } from "bun:test";
import {
  resetSessionRuleOverridesForTesting,
  setSessionRuleOverrideForTesting,
} from "@/config/session_rules.js";
import {
  getSessionWindowForTimestamp,
  isCurrentSessionBar,
} from "@/utils/market_session.js";

describe("market session", () => {
  test("maps supported symbols into the current Chicago trading session", () => {
    const timestamp = Date.UTC(2026, 2, 25, 15, 30, 0, 0);
    const session = getSessionWindowForTimestamp("ESM6", timestamp);

    expect(session).not.toBeNull();
    expect(session?.sessionId).toBe("2026-03-25");
    expect(session?.rootSymbol).toBe("ES");
    expect(session?.timezone).toBe("America/Chicago");
    expect(session?.sessionStartTime).toBe(Date.UTC(2026, 2, 24, 22, 0, 0, 0));
    expect(session?.sessionEndTime).toBe(Date.UTC(2026, 2, 25, 21, 0, 0, 0));
  });

  test("rolls into the next session after the 5 PM CT reopen", () => {
    const timestamp = Date.UTC(2026, 2, 25, 22, 30, 0, 0);
    const session = getSessionWindowForTimestamp("NQM6", timestamp);

    expect(session).not.toBeNull();
    expect(session?.sessionId).toBe("2026-03-26");
    expect(session?.sessionStartTime).toBe(Date.UTC(2026, 2, 25, 22, 0, 0, 0));
    expect(session?.sessionEndTime).toBe(Date.UTC(2026, 2, 26, 21, 0, 0, 0));
  });

  test("returns null for unsupported symbols", () => {
    expect(getSessionWindowForTimestamp("ABCH6", Date.now())).toBeNull();
  });

  test("compares bars against the current trading session instead of UTC day", () => {
    const currentSessionNow = Date.UTC(2026, 2, 25, 20, 30, 0, 0);
    const sameSessionBar = Date.UTC(2026, 2, 24, 23, 0, 0, 0);
    const priorSessionBar = Date.UTC(2026, 2, 24, 20, 0, 0, 0);

    expect(isCurrentSessionBar("ESM6", sameSessionBar, currentSessionNow)).toBe(
      true,
    );
    expect(isCurrentSessionBar("ESM6", priorSessionBar, currentSessionNow)).toBe(
      false,
    );
  });

  test("applies per-root session rule overrides", () => {
    setSessionRuleOverrideForTesting("ES", {
      sessionStartHour: 18,
      sessionEndHour: 17,
    });

    const session = getSessionWindowForTimestamp(
      "ESM6",
      Date.UTC(2026, 2, 25, 23, 30, 0, 0),
    );

    expect(session).not.toBeNull();
    expect(session?.sessionId).toBe("2026-03-26");
    expect(session?.sessionStartTime).toBe(Date.UTC(2026, 2, 25, 23, 0, 0, 0));
    expect(session?.sessionEndTime).toBe(Date.UTC(2026, 2, 26, 22, 0, 0, 0));

    resetSessionRuleOverridesForTesting();
  });
});
