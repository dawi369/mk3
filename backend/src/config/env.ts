import dotenv from "dotenv";

dotenv.config();

export const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "no_api_key_:(";

export const HUB_REST_PORT = process.env.HUB_REST_PORT
  ? parseInt(process.env.HUB_REST_PORT)
  : 3000;

export const EDGE_REST_PORT = process.env.EDGE_REST_PORT
  ? parseInt(process.env.EDGE_REST_PORT)
  : 3002;

export const EDGE_WS_PORT = process.env.EDGE_WS_PORT
  ? parseInt(process.env.EDGE_WS_PORT)
  : 3003;

export const REDIS_HOST = process.env.REDIS_HOST || "localhost";

export const REDIS_PORT = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT)
  : 6379;
