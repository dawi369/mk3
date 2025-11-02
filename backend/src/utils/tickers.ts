// Imports
import fs from 'fs';
// Purpose: Dynamically load and access tickers by asset class, with one-liner access by product_code/ticker, e.g. tickers.grains.ZC or tickers.all.ES

interface TickerEntry {
  [key: string]: any;
  asset_class: string;
  asset_sub_class: string;
  date: string;
  trading_venue: string;
  last_updated: string;
  name: string;
  clearing_channel: string;
  price_quotation: string;
  product_code: string;
  sector: string;
  settlement_currency_code: string;
  settlement_method: string;
  settlement_type: string;
  sub_sector: string;
  trade_currency_code: string;
  type: string;
  unit_of_measure: string;
  unit_of_measure_quantity: number;
}

type TickerGroup = { [key: string]: TickerEntry };

type AssetClass = 'grains' | 'volatiles' | 'us_indices' | 'softs' | 'metals' | 'currencies';


const TICKER_FILES: { [key in AssetClass]: string } = {
  grains: '/home/david/dev/mk3/backend/tickers/grains.json',
  volatiles: '/home/david/dev/mk3/backend/tickers/volatiles.json',
  us_indices: '/home/david/dev/mk3/backend/tickers/us_indices.json',
  softs: '/home/david/dev/mk3/backend/tickers/softs.json',
  metals: '/home/david/dev/mk3/backend/tickers/metals.json',
  currencies: '/home/david/dev/mk3/backend/tickers/currencies.json'
};

function loadJsonWithFallback(filepath: string): TickerEntry[] {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch (err) {
    // Purpose: Make sure error is meaningful to developer
    throw new Error(`Failed to load tickers from ${filepath}: ${err}`);
  }
}

function groupBy(arr: TickerEntry[], codeFields: string[]): TickerGroup {
  const map: TickerGroup = {};
  arr.forEach(entry => {
    for (const key of codeFields) {
      if (entry[key]) {
        map[entry[key]] = entry;
        break;
      }
    }
  });
  return map;
}

function listCodes(group: TickerGroup): string[] {
  return Object.keys(group);
}

function hasCode(group: TickerGroup, code: string): boolean {
  return code in group;
}

function getCode(group: TickerGroup, code: string): TickerEntry | undefined {
  return group[code];
}

export class Tickers {
  grains: TickerGroup;
  volatiles: TickerGroup;
  us_indices: TickerGroup;
  softs: TickerGroup;
  metals: TickerGroup;
  currencies: TickerGroup;
  all: TickerGroup;

  constructor() {
    this.grains = groupBy(loadJsonWithFallback(TICKER_FILES.grains), ["product_code"]);
    this.volatiles = groupBy(loadJsonWithFallback(TICKER_FILES.volatiles), ["product_code"]);
    this.us_indices = groupBy(loadJsonWithFallback(TICKER_FILES.us_indices), ["product_code"]);
    this.softs = groupBy(loadJsonWithFallback(TICKER_FILES.softs), ["product_code"]);
    this.metals = groupBy(loadJsonWithFallback(TICKER_FILES.metals), ["product_code"]);
    this.currencies = groupBy(loadJsonWithFallback(TICKER_FILES.currencies), ["product_code"]);

    // Purpose: Merge all asset classes into one lookup by code (last key wins in conflict)
    this.all = {
      ...this.grains,
      ...this.volatiles,
      ...this.us_indices,
      ...this.softs,
      ...this.metals,
      ...this.currencies
    };
  }

  // Purpose: List all product codes for a specific asset class
  listCodes(assetClass: AssetClass): string[] {
    return listCodes(this[assetClass]);
  }

  // Purpose: Check if a product code exists in a specific asset class
  hasCode(assetClass: AssetClass, code: string): boolean {
    return hasCode(this[assetClass], code);
  }

  // Purpose: Get a ticker entry from a specific asset class, returns undefined if not found
  getCode(assetClass: AssetClass, code: string): TickerEntry | undefined {
    return getCode(this[assetClass], code);
  }

  // Purpose: Get all tickers for a specific sector (e.g., "crude_oil", "precious", "livestock")
  getBySector(sector: string): TickerEntry[] {
    const result: TickerEntry[] = [];
    for (const ticker of Object.values(this.all)) {
      if (ticker.sector === sector) {
        result.push(ticker);
      }
    }
    return result;
  }

  // Purpose: Get all tickers for a specific trading venue (e.g., "XCME", "XNYM")
  getByVenue(venue: string): TickerEntry[] {
    const result: TickerEntry[] = [];
    for (const ticker of Object.values(this.all)) {
      if (ticker.trading_venue === venue) {
        result.push(ticker);
      }
    }
    return result;
  }
}

// Usage example (not executable here):
// const tickers = new Tickers();
// console.log(tickers.grains.ZC);     // Specific grain by product_code
// console.log(tickers.softs.KC);      // Soft ticker by code
// console.log(tickers.all.ES);        // Any asset by code