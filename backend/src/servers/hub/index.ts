import { PolygonWSClient } from "@/api/polygon/ws_client.js";
import { flowStore } from "@/data/flow_store.js";
import type { PolygonMarketType } from "@/utils/types.js";
import { futuresSecondRequest } from "@/utils/consts.js";

const client = new PolygonWSClient();
const futuresMarket: PolygonMarketType = "futures";

await client.connect(futuresMarket);
await client.subscribe(futuresSecondRequest);

setInterval(() => {
  console.log(flowStore.getAllLatest());
  console.log("-----------------------------------");
  console.log(flowStore.getSymbols());
  console.log("-----------------------------------");
}, 5_000);

// setInterval(async () => {
//     const health = await client.getHealth();
//     console.log('Health:', health);
// }, 5_000);
