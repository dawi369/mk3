const TIME_ZONE = "America/New_York";

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
  return date.getTime() - tzDate.getTime();
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function zonedTimeToUtcMs(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second?: number },
  timeZone: string
) {
  const utcGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second ?? 0));
  const offset = getTimeZoneOffsetMs(timeZone, utcGuess);
  return utcGuess.getTime() + offset;
}

export function getGlobexSessionStartMs(now: Date = new Date()): number {
  const zoned = getZonedParts(now, TIME_ZONE);
  const sessionStart = { ...zoned, hour: 18, minute: 0, second: 0 };

  const nowZonedMs = zonedTimeToUtcMs(zoned, TIME_ZONE);
  let sessionStartMs = zonedTimeToUtcMs(sessionStart, TIME_ZONE);

  if (nowZonedMs < sessionStartMs) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const y = getZonedParts(yesterday, TIME_ZONE);
    sessionStartMs = zonedTimeToUtcMs({ ...y, hour: 18, minute: 0, second: 0 }, TIME_ZONE);
  }

  return sessionStartMs;
}

export function getGlobexSessionEndMs(now: Date = new Date()): number {
  const zoned = getZonedParts(now, TIME_ZONE);
  const sessionEnd = { ...zoned, hour: 17, minute: 0, second: 0 };
  const endMs = zonedTimeToUtcMs(sessionEnd, TIME_ZONE);

  const startMs = getGlobexSessionStartMs(now);
  if (endMs <= startMs) {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const t = getZonedParts(tomorrow, TIME_ZONE);
    return zonedTimeToUtcMs({ ...t, hour: 17, minute: 0, second: 0 }, TIME_ZONE);
  }

  return endMs;
}
