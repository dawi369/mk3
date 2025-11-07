import { PolygonWSClient } from '@/api/polygon/ws_client.js';
import { flowStore } from '@/data/flow_store.js';
import type { PolygonWsRequest, PolygonMarketType } from "@/types.js";


const client = new PolygonWSClient();
const futuresMarket: PolygonMarketType = "futures"

// const minuteRequest: PolygonWsRequest = {
//     ev: "AM",
//     symbols: ["SIZ5", "GCZ5", "ESZ5", "NQZ5"],
//   };
  
const secondRequest: PolygonWsRequest = {
    ev: "A",
    symbols: ["SIZ5", "GCZ5", "ESZ5", "NQZ5"],
};

await client.connect(futuresMarket);
await client.subscribe(secondRequest);



setInterval(() => {
    console.log(flowStore.getAllLatest())
    console.log("-----------------------------------")
    console.log(flowStore.getSymbols())
    console.log("-----------------------------------")
}, 5_000);



// setInterval(async () => {
//     const health = await client.getHealth();
//     console.log('Health:', health);
// }, 5_000);