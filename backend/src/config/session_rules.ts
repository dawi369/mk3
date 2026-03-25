export interface SessionRule {
  timezone: string;
  sessionStartHour: number;
  sessionStartMinute: number;
  sessionEndHour: number;
  sessionEndMinute: number;
  maintenanceBreaks: Array<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>;
}

export const DEFAULT_SESSION_RULE: SessionRule = {
  timezone: "America/Chicago",
  sessionStartHour: 17,
  sessionStartMinute: 0,
  sessionEndHour: 16,
  sessionEndMinute: 0,
  maintenanceBreaks: [
    {
      startHour: 16,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
    },
  ],
};

const VENUE_SESSION_RULES: Record<string, Partial<SessionRule>> = {
  XCME: {},
  XCBT: {},
  XCEC: {},
  XNYM: {},
};

const ROOT_SESSION_RULE_OVERRIDES: Record<string, Partial<SessionRule>> = {
  // Add per-root exceptions here as needed, for example:
  // ES: { sessionStartHour: 18, sessionEndHour: 17 },
};

const testSessionRuleOverrides = new Map<string, Partial<SessionRule>>();

export function getSessionRuleForRoot(
  rootSymbol: string,
  tradingVenue?: string,
): SessionRule {
  return {
    ...DEFAULT_SESSION_RULE,
    ...(tradingVenue ? VENUE_SESSION_RULES[tradingVenue] : undefined),
    ...ROOT_SESSION_RULE_OVERRIDES[rootSymbol],
    ...testSessionRuleOverrides.get(rootSymbol),
  };
}

export function setSessionRuleOverrideForTesting(
  rootSymbol: string,
  override: Partial<SessionRule> | null,
): void {
  if (!override) {
    testSessionRuleOverrides.delete(rootSymbol);
    return;
  }

  testSessionRuleOverrides.set(rootSymbol, override);
}

export function resetSessionRuleOverridesForTesting(): void {
  testSessionRuleOverrides.clear();
}
