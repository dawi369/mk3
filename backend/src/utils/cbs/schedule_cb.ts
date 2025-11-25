import type {
  PolygonWsRequest,
  PolygonAssetClass,
} from "@/types/polygon.types.js";
import type { MonthCode } from "@/types/common.types.js";
import { Tickers } from "@/utils/tickers.js";
import {
  ALL_MONTHS,
  ASSET_CLASS_DEFAULTS,
  TICKER_SCHEDULES,
} from "@/utils/schedules.js";
import { isContractExpired } from "@/utils/expiration.js";

class ScheduleContractBuilder {
  private tickers: Tickers;

  constructor() {
    this.tickers = new Tickers();
  }

  private getCurrentMonthInfo(date: Date = new Date()): {
    monthIndex: number; // 0-11
    year: number;
  } {
    return {
      monthIndex: date.getMonth(),
      year: date.getFullYear(),
    };
  }

  private getNextContracts(
    ticker: string,
    schedule: MonthCode[],
    startDate: Date,
    count: number
  ): Array<{ month: MonthCode; year: number }> {
    const contracts: Array<{ month: MonthCode; year: number }> = [];

    // Safety: if schedule is empty, return empty array
    if (schedule.length === 0) return [];

    let currentYear = startDate.getFullYear();
    let currentMonthIndex = startDate.getMonth(); // 0-based

    // Keep searching until we have enough non-expired contracts
    let searchYear = currentYear;
    let attempts = 0;
    const maxAttempts = 50; // Safety limit to prevent infinite loops

    while (contracts.length < count && attempts < maxAttempts) {
      // Iterate through all months in the calendar year
      for (let i = 0; i < ALL_MONTHS.length; i++) {
        const monthCode = ALL_MONTHS[i];

        // Guard: ensure monthCode is defined
        if (!monthCode) {
          continue;
        }

        // Skip months before current month in the starting year
        if (searchYear === currentYear && i < currentMonthIndex) {
          continue;
        }

        // Check if this month is in the ticker's trading schedule
        if (!schedule.includes(monthCode)) {
          continue;
        }

        // Check if this contract is expired
        const yearSuffix = searchYear % 10; // Single digit year
        if (!isContractExpired(ticker, monthCode, searchYear, startDate)) {
          contracts.push({ month: monthCode, year: searchYear });

          // Stop if we have enough contracts
          if (contracts.length >= count) {
            return contracts;
          }
        }
      }

      // Move to next year
      searchYear++;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn(`Reached max attempts finding contracts for ${ticker}`);
    }

    return contracts;
  }

  private buildContractSymbol(
    root: string,
    month: MonthCode,
    year: number
  ): string {
    const yearSuffix = year.toString().slice(-1); // Last digit for Polygon?
    // Wait, previous builders used `slice(-1)`?
    // Let's check quarterly_cb.ts: `const yearSuffix = year.toString().slice(-1);`
    // Yes, Polygon futures usually use 1 digit year? Or 2?
    // Standard is often 2, but let's stick to what was there.
    // Actually, let me double check the previous file content I read.
    // Step 12: `const yearSuffix = year.toString().slice(-1);` -> Yes, 1 digit.
    return `${root}${month}${yearSuffix}`;
  }

  buildRequest(
    assetClass: PolygonAssetClass, // Note: PolygonAssetClass type might need update if it's restrictive
    eventType: "A" | "AM",
    count: number
  ): PolygonWsRequest {
    // Cast assetClass to string to use as key for Tickers
    // The Tickers class uses a broader AssetClass type
    const tickerRoots = this.tickers.listCodes(assetClass as any);
    const symbols: string[] = [];
    const now = new Date();

    for (const root of tickerRoots) {
      // 1. Check specific ticker schedule
      let schedule = TICKER_SCHEDULES[root];

      // 2. Fallback to asset class default
      if (!schedule) {
        schedule = ASSET_CLASS_DEFAULTS[assetClass];
      }

      // 3. If still no schedule, skip or warn
      if (!schedule || schedule.length === 0) {
        console.warn(
          `No schedule found for ticker ${root} in ${assetClass}, skipping.`
        );
        continue;
      }

      const contracts = this.getNextContracts(root, schedule, now, count);

      for (const { month, year } of contracts) {
        symbols.push(this.buildContractSymbol(root, month, year));
      }
    }

    return {
      ev: eventType,
      symbols,
      assetClass,
    };
  }
}

export const scheduleBuilder = new ScheduleContractBuilder();
