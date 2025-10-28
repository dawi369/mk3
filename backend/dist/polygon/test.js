import { websocketClient } from "@polygon.io/client-js";
import { POLYGON_API_KEY, POLYGON_WS_URL } from "../config/env.ts";
const SUBSCRIPTION_PARAMS = "AM.ES";
// create a websocket client using the polygon client-js library
const ws = websocketClient(POLYGON_API_KEY, POLYGON_WS_URL).futures();
// register a handler to log errors
ws.onerror = (err) => console.log("Failed to connect", err);
// register a handler to log info if websocket closes
ws.onclose = (code, reason) => console.log("Connection closed", code, reason);
// register a handler when messages are received
ws.onmessage = (msg) => {
    // parse the data from the message
    const parsedMessage = JSON.parse(msg.data);
    // wait until the message saying authentication was successful, then subscribe to a channel
    if (parsedMessage[0].ev === "status" &&
        parsedMessage[0].status === "auth_success") {
        console.log("Subscribing to the minute aggregates channel for ES");
        ws.send(JSON.stringify({ action: "subscribe", params: SUBSCRIPTION_PARAMS }));
    }
    console.log("Message received:", parsedMessage);
};
//# sourceMappingURL=test.js.map