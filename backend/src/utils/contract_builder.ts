import type { PolygonWsRequest } from '@/utils/types.js';
import { Tickers } from '@/utils/tickers.js';

type MonthCode = 'F' | 'G' | 'H' | 'J' | 'K' | 'M' | 'N' | 'Q' | 'U' | 'V' | 'X' | 'Z';

const QUARTERLY_MONTHS: MonthCode[] = ['H', 'M', 'U', 'Z'];  // Mar, Jun, Sep, Dec

class USIndicesContractBuilder {
  private tickers: Tickers;

  constructor() {
    this.tickers = new Tickers();
  }

  private getCurrentQuarter(date: Date = new Date()): { month: MonthCode; year: number } {
    const currentMonth = date.getMonth() + 1;
    const currentYear = date.getFullYear();

    // Map calendar month to next quarterly month
    if (currentMonth <= 3) {
      return { month: 'H', year: currentYear };      // March
    } else if (currentMonth <= 6) {
      return { month: 'M', year: currentYear };      // June
    } else if (currentMonth <= 9) {
      return { month: 'U', year: currentYear };      // September
    } else {
      return { month: 'Z', year: currentYear };      // December
    }
  }

  private getNextQuarters(startMonth: MonthCode, startYear: number, count: number): Array<{ month: MonthCode; year: number }> {
    const quarters: Array<{ month: MonthCode; year: number }> = [];
    let currentIndex = QUARTERLY_MONTHS.indexOf(startMonth);
    let currentYear = startYear;

    for (let i = 0; i < count; i++) {
      quarters.push({ month: QUARTERLY_MONTHS[currentIndex]!, year: currentYear });
      
      currentIndex++;
      if (currentIndex >= QUARTERLY_MONTHS.length) {
        currentIndex = 0;
        currentYear++;
      }
    }

    return quarters;
  }

  private buildContractSymbol(root: string, month: MonthCode, year: number): string {
    const yearSuffix = year.toString().slice(-2);
    return `${root}${month}${yearSuffix}`;
  }

  buildQuarterlyRequest(eventType: 'A' | 'AM' = 'A', totalQuarters: number): PolygonWsRequest {
    const currentQuarter = this.getCurrentQuarter();
    const quarters = this.getNextQuarters(currentQuarter.month, currentQuarter.year, totalQuarters);
    
    const roots = this.tickers.listCodes('us_indices');
    const symbols: string[] = [];

    for (const root of roots) {
      for (const { month, year } of quarters) {
        const symbol = this.buildContractSymbol(root, month, year);
        symbols.push(symbol);
      }
    }

    return {
      ev: eventType,
      symbols,
    };
  }
}

export const usIndicesBuilder = new USIndicesContractBuilder();

