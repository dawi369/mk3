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
 * Get the front month (earliest available) from a list of tickers
 */
export function getFrontMonth(tickers: string[]): string | null {
  const months = tickers.map(extractMonthCode).filter((code): code is string => code !== null);

  if (months.length === 0) return null;

  // Find the earliest month by comparing month numbers
  let earliestCode = months[0];
  let earliestNum = MONTH_CODE_TO_NUMBER[earliestCode] || 999;

  for (const code of months) {
    const num = MONTH_CODE_TO_NUMBER[code];
    if (num && num < earliestNum) {
      earliestNum = num;
      earliestCode = code;
    }
  }

  return earliestCode;
}

/**
 * Filter tickers by month code
 */
export function filterByMonth(tickers: string[], monthFilter: string): string[] {
  if (monthFilter === "Front") {
    const frontMonth = getFrontMonth(tickers);
    if (!frontMonth) return tickers;
    return tickers.filter((ticker) => extractMonthCode(ticker) === frontMonth);
  }

  // Filter by specific month name (e.g., "Jan", "Feb")
  const monthCode = Object.entries(MONTH_CODES).find(([_, name]) => name === monthFilter)?.[0];
  if (!monthCode) return tickers;

  return tickers.filter((ticker) => extractMonthCode(ticker) === monthCode);
}
