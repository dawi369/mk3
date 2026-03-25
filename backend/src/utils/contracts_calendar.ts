import type { ActiveContract } from "@/types/contract.types.js";

import activeMonthsData from "../../tickers/active_months.json" with {
  type: "json",
};

export const MONTH_ORDER: Record<string, number> = {
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

const ACTIVE_MONTHS: Record<string, string[]> = {};
for (const category of Object.values(activeMonthsData.FUTURES_ACTIVE_MONTHS)) {
  for (const [ticker, months] of Object.entries(category)) {
    ACTIVE_MONTHS[ticker] = months as string[];
  }
}

function getYearSuffixes(referenceDate: Date): [string, string] {
  const currentYear = referenceDate.getFullYear();
  return [String(currentYear % 10), String((currentYear + 1) % 10)];
}

function getFullYearFromSuffix(
  yearSuffix: string,
  referenceDate: Date,
): number {
  const currentYear = referenceDate.getFullYear();
  const currentDecade = currentYear - (currentYear % 10);
  const suffix = Number(yearSuffix);

  if (!Number.isFinite(suffix)) {
    return currentYear;
  }

  let year = currentDecade + suffix;
  if (year < currentYear - 1) {
    year += 10;
  }
  return year;
}

function estimateLastTradeDate(
  monthCode: string,
  yearSuffix: string,
  referenceDate: Date,
): string {
  const month = MONTH_ORDER[monthCode];
  const year = getFullYearFromSuffix(yearSuffix, referenceDate);

  if (!month) {
    return referenceDate.toISOString().slice(0, 10);
  }

  const lastDayOfMonth = new Date(Date.UTC(year, month, 0));
  return lastDayOfMonth.toISOString().slice(0, 10);
}

export function getConfiguredMonths(root: string): string[] {
  return ACTIVE_MONTHS[root] || [];
}

export function generateContractSymbols(
  root: string,
  limit: number,
  referenceDate: Date = new Date(),
): string[] {
  const months = getConfiguredMonths(root);
  if (months.length === 0 || limit <= 0) {
    return [];
  }

  const currentMonth = referenceDate.getMonth() + 1;
  const [currentYearSuffix, nextYearSuffix] = getYearSuffixes(referenceDate);
  const symbols: { symbol: string; sortKey: number }[] = [];

  for (const monthCode of months) {
    const monthNum = MONTH_ORDER[monthCode];
    if (monthNum && monthNum >= currentMonth) {
      symbols.push({
        symbol: `${root}${monthCode}${currentYearSuffix}`,
        sortKey: monthNum,
      });
    }
  }

  for (const monthCode of months) {
    const monthNum = MONTH_ORDER[monthCode];
    if (monthNum) {
      symbols.push({
        symbol: `${root}${monthCode}${nextYearSuffix}`,
        sortKey: monthNum + 12,
      });
    }
  }

  symbols.sort((a, b) => a.sortKey - b.sortKey);
  return symbols.slice(0, limit).map((entry) => entry.symbol);
}

export function buildGeneratedContracts(
  root: string,
  limit: number,
  referenceDate: Date = new Date(),
): ActiveContract[] {
  return generateContractSymbols(root, limit, referenceDate).map((symbol) => {
    const monthCode = symbol.slice(root.length, root.length + 1);
    const yearSuffix = symbol.slice(root.length + 1);

    return {
      ticker: symbol,
      productCode: root,
      lastTradeDate: estimateLastTradeDate(
        monthCode,
        yearSuffix,
        referenceDate,
      ),
      active: true,
    };
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isOutrightTickerForRoot(root: string, ticker: string): boolean {
  const pattern = new RegExp(`^${escapeRegex(root)}[FGHJKMNQUVXZ]\\d$`);
  return pattern.test(ticker);
}
