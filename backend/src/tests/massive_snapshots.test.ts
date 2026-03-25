import { describe, expect, mock, spyOn, test } from "bun:test";
import {
  fetchTickerSnapshotContract,
  parseSettlementDate,
  snapshotContractToSnapshotData,
} from "@/utils/massive_snapshots.js";

describe("massive snapshots", () => {
  test("parses string and epoch settlement dates", () => {
    expect(parseSettlementDate("2099-03-15")).toBe("2099-03-15");
    expect(parseSettlementDate(Date.UTC(2099, 2, 15))).toBe("2099-03-15");
    expect(parseSettlementDate(null)).toBe("");
  });

  test("maps snapshot contracts into redis snapshot data", () => {
    const snapshot = snapshotContractToSnapshotData({
      details: {
        ticker: "ESH9",
        product_code: "ES",
        settlement_date: "2099-03-15",
      },
      session: {
        open: 10,
        high: 12,
        low: 9,
        close: 11,
        settlement_price: 11.5,
        previous_settlement: 10.5,
        change: 1,
        change_percent: 10,
      },
      open_interest: 123,
    });

    expect(snapshot.productCode).toBe("ES");
    expect(snapshot.settlementDate).toBe("2099-03-15");
    expect(snapshot.openInterest).toBe(123);
    expect(snapshot.settlementPrice).toBe(11.5);
  });

  test("fetches the first snapshot result when the API responds with data", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "OK",
          results: [
            {
              details: {
                ticker: "ESH9",
                product_code: "ES",
                settlement_date: "2099-03-15",
              },
            },
          ],
        }),
        { status: 200 },
      ) as any,
    );

    const result = await fetchTickerSnapshotContract("ESH9");
    expect(result?.details.ticker).toBe("ESH9");
  });

  test("returns null when the snapshot request fails", async () => {
    spyOn(globalThis, "fetch").mockRejectedValue(new Error("snapshot down"));

    await expect(fetchTickerSnapshotContract("ESH9")).resolves.toBeNull();
  });
});
