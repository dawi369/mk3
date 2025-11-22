import type {
  PolygonWsRequest,
  PolygonAssetClass,
} from "@/types/polygon.types.js";
import type { MonthCode } from "@/types/common.types.js";
import { Tickers } from "@/utils/tickers.js";
import { ALL_MONTHS } from "@/utils/consts.js";

class MonthlyContractBuilder {
  private tickers: Tickers;

  constructor() {
    this.tickers = new Tickers();
  }

  private getCurrentMonth(date: Date = new Date()): {
    month: MonthCode;
    year: number;
  } {
    const currentMonth = date.getMonth() + 1;
    const currentYear = date.getFullYear();

    // Map calendar month to futures month code
    const monthCodes: MonthCode[] = [
      "F", // January
      "G", // February
      "H", // March
      "J", // April
      "K", // May
      "M", // June
      "N", // July
      "Q", // August
      "U", // September
      "V", // October
      "X", // November
      "Z", // December
    ];

    return {
      month: monthCodes[currentMonth - 1]!,
      year: currentYear,
    };
  }

  private getNextMonths(
    startMonth: MonthCode,
    startYear: number,
    count: number
  ): Array<{ month: MonthCode; year: number }> {
    const months: Array<{ month: MonthCode; year: number }> = [];
    let currentIndex = ALL_MONTHS.indexOf(startMonth);
    let currentYear = startYear;

    for (let i = 0; i < count; i++) {
      months.push({
        month: ALL_MONTHS[currentIndex]!,
        year: currentYear,
      });

      currentIndex++;
      if (currentIndex >= ALL_MONTHS.length) {
        currentIndex = 0;
        currentYear++;
      }
    }

    return months;
  }

  private buildContractSymbol(
    root: string,
    month: MonthCode,
    year: number
  ): string {
    const yearSuffix = year.toString().slice(-1);
    return `${root}${month}${yearSuffix}`;
  }

  buildMonthlyRequest(
    assetClass: PolygonAssetClass,
    eventType: "A" | "AM",
    totalMonths: number
  ): PolygonWsRequest {
    const currentMonth = this.getCurrentMonth();
    const months = this.getNextMonths(
      currentMonth.month,
      currentMonth.year,
      totalMonths
    );

    const roots = this.tickers.listCodes(assetClass);
    const symbols: string[] = [];

    for (const root of roots) {
      for (const { month, year } of months) {
        const symbol = this.buildContractSymbol(root, month, year);
        symbols.push(symbol);
      }
    }

    return {
      ev: eventType,
      symbols,
      assetClass,
    };
  }
}

export const monthlyBuilder = new MonthlyContractBuilder();
