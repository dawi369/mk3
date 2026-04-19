import grainsData from "../../tickers/grains.json" with { type: "json" };
import metalsData from "../../tickers/metals.json" with { type: "json" };
import currenciesData from "../../tickers/currencies.json" with { type: "json" };
import softsData from "../../tickers/softs.json" with { type: "json" };
import usIndicesData from "../../tickers/us_indices.json" with { type: "json" };
import volatilesData from "../../tickers/volatiles.json" with { type: "json" };
import { getSessionRuleForRoot } from "@/config/session_rules.js";
import type { SessionWindow } from "@/types/session.types.js";

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface ZonedDateTimeParts extends DateParts {
  hour: number;
  minute: number;
  second: number;
}

interface SupportedTickerEntry {
  product_code?: string;
  trading_venue?: string;
}

const SUPPORTED_ROOTS = new Set<string>();
const ROOT_TO_VENUE = new Map<string, string>();
for (const dataset of [
  grainsData,
  metalsData,
  currenciesData,
  softsData,
  usIndicesData,
  volatilesData,
] as SupportedTickerEntry[][]) {
  for (const entry of dataset) {
    if (typeof entry.product_code === "string" && entry.product_code.length > 0) {
      SUPPORTED_ROOTS.add(entry.product_code);
      if (
        typeof entry.trading_venue === "string" &&
        entry.trading_venue.length > 0 &&
        !ROOT_TO_VENUE.has(entry.product_code)
      ) {
        ROOT_TO_VENUE.set(entry.product_code, entry.trading_venue);
      }
    }
  }
}

function extractRootSymbol(symbol: string): string {
  const match = symbol.match(/^([A-Z0-9]+)[FGHJKMNQUVXZ]\d{1,2}$/);
  return match?.[1] || symbol;
}

function formatterForTimeZone(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

function getZonedDateTimeParts(
  timestamp: number,
  timeZone: string,
): ZonedDateTimeParts {
  const parts = formatterForTimeZone(timeZone).formatToParts(new Date(timestamp));
  const lookup = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.get("year")),
    month: Number(lookup.get("month")),
    day: Number(lookup.get("day")),
    hour: Number(lookup.get("hour")),
    minute: Number(lookup.get("minute")),
    second: Number(lookup.get("second")),
  };
}

function shiftDateParts(date: DateParts, deltaDays: number): DateParts {
  const utcMs = Date.UTC(date.year, date.month - 1, date.day + deltaDays);
  const shifted = new Date(utcMs);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function formatDateParts(date: DateParts): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

function parseGmtOffsetMs(value: string): number {
  if (value === "GMT" || value === "UTC") {
    return 0;
  }

  const match = value.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    throw new Error(`Unsupported timezone offset format: ${value}`);
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] || "0");
  const minutes = Number(match[3] || "0");
  return sign * ((hours * 60 + minutes) * 60 * 1000);
}

function getTimezoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));

  const offsetName =
    parts.find((part) => part.type === "timeZoneName")?.value || "GMT";
  return parseGmtOffsetMs(offsetName);
}

function zonedDateTimeToUtcMs(
  date: DateParts,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): number {
  const naiveUtc = Date.UTC(date.year, date.month - 1, date.day, hour, minute, second);
  let guess = naiveUtc;

  for (let attempt = 0; attempt < 4; attempt++) {
    const offsetMs = getTimezoneOffsetMs(guess, timeZone);
    const corrected = naiveUtc - offsetMs;
    if (corrected === guess) {
      return corrected;
    }
    guess = corrected;
  }

  return guess;
}

export function getSessionWindowForTimestamp(
  symbol: string,
  timestamp: number,
): SessionWindow | null {
  const rootSymbol = extractRootSymbol(symbol);
  if (!SUPPORTED_ROOTS.has(rootSymbol)) {
    return null;
  }

  const tradingVenue = ROOT_TO_VENUE.get(rootSymbol);
  const sessionRule = getSessionRuleForRoot(rootSymbol, tradingVenue);

  const local = getZonedDateTimeParts(timestamp, sessionRule.timezone);
  const localDate = {
    year: local.year,
    month: local.month,
    day: local.day,
  };

  const tradingDate =
    local.hour > sessionRule.sessionStartHour ||
    (local.hour === sessionRule.sessionStartHour &&
      local.minute >= sessionRule.sessionStartMinute)
      ? shiftDateParts(localDate, 1)
      : localDate;
  const sessionStartDate = shiftDateParts(tradingDate, -1);

  return {
    sessionId: formatDateParts(tradingDate),
    rootSymbol,
    timezone: sessionRule.timezone,
    sessionStartTime: zonedDateTimeToUtcMs(
      sessionStartDate,
      sessionRule.sessionStartHour,
      sessionRule.sessionStartMinute,
      0,
      sessionRule.timezone,
    ),
    sessionEndTime: zonedDateTimeToUtcMs(
      tradingDate,
      sessionRule.sessionEndHour,
      sessionRule.sessionEndMinute,
      0,
      sessionRule.timezone,
    ),
  };
}

export function getCurrentSessionWindow(symbol: string): SessionWindow | null {
  return getSessionWindowForTimestamp(symbol, Date.now());
}

export function isCurrentSessionBar(
  symbol: string,
  timestamp: number,
  nowTimestamp = Date.now(),
): boolean {
  const barWindow = getSessionWindowForTimestamp(symbol, timestamp);
  const currentWindow = getSessionWindowForTimestamp(symbol, nowTimestamp);

  if (!barWindow || !currentWindow) {
    return false;
  }

  return (
    barWindow.sessionId === currentWindow.sessionId &&
    barWindow.rootSymbol === currentWindow.rootSymbol
  );
}
