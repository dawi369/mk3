type MonthCode = 'F' | 'G' | 'H' | 'J' | 'K' | 'M' | 'N' | 'Q' | 'U' | 'V' | 'X' | 'Z';

interface MonthInfo {
  number: number;
  name: string;
}

class FuturesMonth {
  private static months: Record<MonthCode, MonthInfo> = {
    F: { number: 1, name: 'January' },
    G: { number: 2, name: 'February' },
    H: { number: 3, name: 'March' },
    J: { number: 4, name: 'April' },
    K: { number: 5, name: 'May' },
    M: { number: 6, name: 'June' },
    N: { number: 7, name: 'July' },
    Q: { number: 8, name: 'August' },
    U: { number: 9, name: 'September' },
    V: { number: 10, name: 'October' },
    X: { number: 11, name: 'November' },
    Z: { number: 12, name: 'December' }
  };

  static getNumber(code: MonthCode): number {
    return FuturesMonth.months[code].number;
  }

  static getName(code: MonthCode): string {
    return FuturesMonth.months[code].name;
  }

  static getCode(number: number): MonthCode {
    const entry = Object.entries(FuturesMonth.months).find(
      ([, v]) => v.number === number
    );
    if (!entry) throw new Error(`Invalid month number: ${number}`);
    return entry[0] as MonthCode;
  }
}

// Example usage:
// const num: number = FuturesMonth.getNumber('Z'); // 12
// const name: string = FuturesMonth.getName('H');  // "March"
// const code: MonthCode = FuturesMonth.getCode(10); // "V"

// console.log(num, name, code);
