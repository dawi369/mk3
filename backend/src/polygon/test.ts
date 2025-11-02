import { websocketClient } from "@polygon.io/client-js";
import { POLYGON_API_KEY, POLYGON_WS_URL } from "../config/env.js";

const SUBSCRIPTION_PARAMS = "AM.ESZ5";

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
