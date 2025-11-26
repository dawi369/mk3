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
    const contractsMap = new Map<string, Contract>();
    let nextUrl:
      | string
      | null = `${POLYGON_CONTRACTS_URL}?product_code=${root}&active=true&apiKey=${this.apiKey}`;

    try {
      while (nextUrl) {
        // Ensure apiKey is present in nextUrl if it was stripped (API usually includes params in next_url but let's be safe)
        // Actually, the next_url usually contains all params.
        // But if we need to add auth header, we should.

        const response = await fetch(nextUrl, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          console.error(
            `Failed to fetch contracts for ${root}: ${response.status} ${response.statusText}`
          );
          break;
        }

        const data: any = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];

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

        // If next_url doesn't have apiKey and we rely on query param, we might need to append it.
        // But we are using Header auth now, so it should be fine.
      }
    } catch (error) {
      console.error(`Error fetching contracts for ${root}:`, error);
    }

    const contracts = Array.from(contractsMap.values());

    // Sort by last_trade_date
    contracts.sort((a, b) => {
      return (
        new Date(a.last_trade_date).getTime() -
        new Date(b.last_trade_date).getTime()
      );
    });

    return contracts.map((c) => c.ticker);
  }
}

export const contractProvider = new ContractProvider();
