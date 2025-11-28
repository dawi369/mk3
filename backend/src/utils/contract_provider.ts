import { POLYGON_API_KEY } from "@/config/env.js";
import { POLYGON_CONTRACTS_URL } from "@/utils/consts.js";

interface Contract {
  ticker: string;
  product_code: string;
  last_trade_date: string;
  active: boolean;
}

export class ContractProvider {
  private apiKey: string;

  constructor(apiKey: string = POLYGON_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch all active contracts for a given root symbol (product code).
   * @param root The product code (e.g. "ES")
   * @returns List of contract tickers (e.g. ["ESZ5", "ESH6"]) sorted by expiration.
   */
  async fetchActiveContracts(root: string): Promise<string[]> {
    console.log(`[ContractProvider] Starting fetch for ${root}`);
    const contractsMap = new Map<string, Contract>();
    let nextUrl: string | null = `${POLYGON_CONTRACTS_URL}?product_code=${root}&active=true&apiKey=${this.apiKey}`;
    let pageCount = 0;

    try {
      while (nextUrl) {
        pageCount++;
        console.log(`[ContractProvider] Fetching page ${pageCount} for ${root}...`);
        // console.log(`[ContractProvider] URL: ${nextUrl.replace(this.apiKey, "REDACTED")}`);

        const response = await fetch(nextUrl, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
        });

        // console.log(`[ContractProvider] Response status for ${root}: ${response.status}`);

        if (!response.ok) {
          console.error(`[ContractProvider] Failed to fetch contracts for ${root}: ${response.status} ${response.statusText}`);
          break;
        }

        const data: any = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];
        console.log(`[ContractProvider] Received ${results.length} results for ${root} (page ${pageCount})`);

        for (const item of results) {
          if (item.active !== false && item.type === "single") {
            // Deduplicate by ticker
            if (!contractsMap.has(item.ticker)) {
              contractsMap.set(item.ticker, {
                ticker: item.ticker,
                product_code: item.product_code,
                last_trade_date: item.last_trade_date,
                active: item.active,
              });
            }
          }
        }

        nextUrl = data.next_url;
        console.log(`[ContractProvider] Next URL for ${root}: ${nextUrl ? "exists" : "null (done)"}`);
        console.log(`[ContractProvider] Total unique contracts so far for ${root}: ${contractsMap.size}`);

        // If next_url doesn't have apiKey and we rely on query param, we might need to append it.
        // But we are using Header auth now, so it should be fine.
      }
    } catch (error) {
      console.error(`[ContractProvider] Error fetching contracts for ${root}:`, error);
      throw error; // Re-throw to help identify the issue
    }

    console.log(`[ContractProvider] Finished fetching for ${root}, total pages: ${pageCount}`);
    const contracts = Array.from(contractsMap.values());
    console.log(`[ContractProvider] Total unique contracts for ${root}: ${contracts.length}`);

    // Filter out expired contracts (last_trade_date in the past)
    const now = new Date();
    const activeContracts = contracts.filter((c) => {
      const lastTradeDate = new Date(c.last_trade_date);
      const isActive = lastTradeDate >= now;
      if (!isActive) {
        console.log(`[ContractProvider] Filtering out expired contract ${c.ticker} (last trade: ${c.last_trade_date})`);
      }
      return isActive;
    });

    console.log(`[ContractProvider] Active contracts after expiration filter for ${root}: ${activeContracts.length}`);

    // Sort by last_trade_date
    activeContracts.sort((a, b) => {
      return new Date(a.last_trade_date).getTime() - new Date(b.last_trade_date).getTime();
    });

    const tickers = activeContracts.map((c) => c.ticker);
    console.log(`[ContractProvider] Returning ${tickers.length} tickers for ${root}:`, tickers.slice(0, 5));
    return tickers;
  }
}

export const contractProvider = new ContractProvider();
