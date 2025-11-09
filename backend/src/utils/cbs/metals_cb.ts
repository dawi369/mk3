import type { PolygonWsRequest, MonthCode } from '@/utils/types.js';
import { Tickers } from '@/utils/tickers.js';
import { ALL_MONTHS } from '@/utils/consts.js';

class MetalsContractBuilder {
  private tickers: Tickers;

  constructor() {
    this.tickers = new Tickers();
  }

  private getCurrentMonth(date: Date = new Date()): { month: MonthCode; year: number } {
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    return { 
      month: ALL_MONTHS[currentMonth]!, 
      year: currentYear 
    };
  }

  private getNextMonths(startMonth: MonthCode, startYear: number, count: number): Array<{ month: MonthCode; year: number }> {
    const months: Array<{ month: MonthCode; year: number }> = [];
    let currentIndex = ALL_MONTHS.indexOf(startMonth);
    let currentYear = startYear;

    for (let i = 0; i < count; i++) {
      months.push({ month: ALL_MONTHS[currentIndex]!, year: currentYear });
      
      currentIndex++;
      if (currentIndex >= ALL_MONTHS.length) {
        currentIndex = 0;
        currentYear++;
      }
    }

    return months;
  }

  private buildContractSymbol(root: string, month: MonthCode, year: number): string {
    const yearSuffix = year.toString().slice(-2);
    return `${root}${month}${yearSuffix}`;
  }

  buildMonthlyRequest(eventType: 'A' | 'AM', totalMonths: number): PolygonWsRequest {
    const currentMonth = this.getCurrentMonth();
    const months = this.getNextMonths(currentMonth.month, currentMonth.year, totalMonths);
    
    const roots = this.tickers.listCodes('metals');
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
    };
  }
}

export const metalsBuilder = new MetalsContractBuilder();

