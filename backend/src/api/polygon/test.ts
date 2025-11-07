import { websocketClient } from "@polygon.io/client-js";
import { POLYGON_API_KEY } from "@/config/env.js";
import { POLYGON_WS_URL } from "@/utils/consts.js"

// const SUBSCRIPTION_PARAMS = "AM.ESZ5";
const SUBSCRIPTION_PARAMS = "A.ESZ5";


// [
//   {
//     ev: 'A',
//     sym: 'ESZ5',
//     v: 48,
//     dv: 330515.5,
//     n: 18,
//     o: 6885.75,
//     c: 6885.5,
//     h: 6885.75,
//     l: 6885.5,
//     s: 1762189979000,
//     e: 1762189980000
//   }
// ]

// create a websocket client using the polygon client-js library
const ws = websocketClient(POLYGON_API_KEY, POLYGON_WS_URL).futures();

// register a handler to log errors
ws.onerror = (err: unknown) => console.log("Failed to connect", err);

// register a handler to log info if websocket closes
ws.onclose = (code: number, reason: string) =>
  console.log("Connection closed", code, reason);

// register a handler when messages are received
ws.onmessage = (msg: MessageEvent) => {
  // parse the data from the message
  const parsedMessage = JSON.parse(msg.data);

  // wait until the message saying authentication was successful, then subscribe to a channel
  if (
    parsedMessage[0].ev === "status" &&
    parsedMessage[0].status === "auth_success"
  ) {
    console.log("Subscribing to the second aggregates channel");
    ws.send(JSON.stringify({ action: "subscribe", params: SUBSCRIPTION_PARAMS }));
  }

  console.log("Message received:", parsedMessage);
};
