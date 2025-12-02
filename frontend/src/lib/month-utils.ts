// Futures month codes mapping
// F=Jan, G=Feb, H=Mar, J=Apr, K=May, M=Jun, N=Jul, Q=Aug, U=Sep, V=Oct, X=Nov, Z=Dec
export const MONTH_CODES: Record<string, string> = {
  F: "Jan",
  G: "Feb",
  H: "Mar",
  J: "Apr",
  K: "May",
  M: "Jun",
  N: "Jul",
  Q: "Aug",
  U: "Sep",
  V: "Oct",
  X: "Nov",
  Z: "Dec",
};

export const MONTH_CODE_TO_NUMBER: Record<string, number> = {
  F: 1,
  G: 2,
  H: 3,
  J: 4,
  K: 5,
  M: 6,
  N: 7,
  Q: 8,
  U: 9,
  V: 10,
  X: 11,
  Z: 12,
};

export const ALL_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Extract month code from ticker symbol
 * e.g., "GCZ5" → "Z", "ESH6" → "H"
 */
export function extractMonthCode(ticker: string): string | null {
  // Month code is typically the second-to-last or third-to-last character
  // Standard format: ROOT + MONTH + YEAR (e.g., GC + Z + 5)
  const match = ticker.match(/([FGHJKMNQUVXZ])(\d{1,2})$/);
  return match ? match[1] : null;
}

/**
 * Get display name for month code
 */
export function getMonthName(code: string): string {
  return MONTH_CODES[code] || code;
}

/**
 * Extract year from ticker symbol
 * e.g., "GCZ5" → 5, "ESH26" → 26
 */
function extractYear(ticker: string): number | null {
  const match = ticker.match(/([FGHJKMNQUVXZ])(\d{1,2})$/);
  return match ? parseInt(match[2], 10) : null;
}

/**
 * Extract ticker root (symbol without month/year)
 * e.g., "GCZ5" → "GC", "ESH26" → "ES"
 */
function extractRoot(ticker: string): string {
  const match = ticker.match(/^([A-Z]+)[FGHJKMNQUVXZ]\d{1,2}$/);
  return match ? match[1] : ticker;
}

/**
 * Compare two tickers to determine which is earlier
 * Returns negative if a is earlier, positive if b is earlier
 */
function compareTickerDates(a: string, b: string): number {
  const monthA = extractMonthCode(a);
  const monthB = extractMonthCode(b);
  const yearA = extractYear(a);
  const yearB = extractYear(b);

  if (!monthA || !monthB || yearA === null || yearB === null) return 0;

  // Compare years first
  if (yearA !== yearB) {
    return yearA - yearB;
  }

  // If same year, compare months
  const monthNumA = MONTH_CODE_TO_NUMBER[monthA] || 0;
  const monthNumB = MONTH_CODE_TO_NUMBER[monthB] || 0;
  return monthNumA - monthNumB;
}

/**
 * Filter tickers by month code
 */
export function filterByMonth(tickers: string[], monthFilter: string): string[] {
  if (monthFilter === "All") {
    return tickers;
  }

  if (monthFilter === "Front") {
    // Group tickers by root symbol
    const tickersByRoot = new Map<string, string[]>();

    for (const ticker of tickers) {
      const root = extractRoot(ticker);
      if (!tickersByRoot.has(root)) {
        tickersByRoot.set(root, []);
      }
      tickersByRoot.get(root)!.push(ticker);
    }

    // For each root, find the earliest contract
    const frontContracts: string[] = [];
    for (const [_, rootTickers] of tickersByRoot) {
      if (rootTickers.length === 0) continue;

      // Sort by date and take the earliest
      const sorted = [...rootTickers].sort(compareTickerDates);
      frontContracts.push(sorted[0]);
    }

    return frontContracts;
  }

  // Filter by specific month name (e.g., "Jan", "Feb")
  const monthCode = Object.entries(MONTH_CODES).find(([_, name]) => name === monthFilter)?.[0];
  if (!monthCode) return tickers;

  return tickers.filter((ticker) => extractMonthCode(ticker) === monthCode);
}
