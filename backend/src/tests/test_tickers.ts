import { Tickers } from "@/utils/tickers.js";

async function main() {
  const tickers = await Tickers.create();

console.log(tickers.all);

// Direct access (returns undefined if not found)
console.log(tickers.grains.ZC); // ✅ Specific grain by product_code
console.log(tickers.softs.KC); // ❌ undefined - "KC" doesn't exist (valid codes: KT, CJ, TT, YO)
console.log(tickers.all.ES); // ✅ Any asset by code

// Graceful access with hasCode check
const checkCode = "KC";
if (tickers.hasCode("softs", checkCode)) {
  console.log("Found:", tickers.getCode("softs", checkCode));
} else {
  console.log(
    `Code "${checkCode}" not found in softs. Available codes:`,
    tickers.listCodes("softs")
  );
}

// Get tickers by sector (useful for us_indices)
const usIndices = tickers.getBySector("us_index");
console.log(
  "US Indices:",
  usIndices.map((t) => `${t.product_code} - ${t.name}`)
);

// Get tickers by venue
const xcmeTickers = tickers.getByVenue("XCME");
console.log(
  "XCME tickers:",
  xcmeTickers.map((t) => t.product_code)
);
}

main();
