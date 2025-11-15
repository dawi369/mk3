import dotenv from "dotenv";

dotenv.config();

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarAsInt(key: string): number {
  const value = getEnvVar(key);
  const parsed = parseInt(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

export const POLYGON_API_KEY = getEnvVar("POLYGON_API_KEY");
export const HUB_REST_PORT = getEnvVarAsInt("HUB_REST_PORT");
export const EDGE_REST_PORT = getEnvVarAsInt("EDGE_REST_PORT");
export const EDGE_WS_PORT = getEnvVarAsInt("EDGE_WS_PORT");
export const REDIS_HOST = getEnvVar("REDIS_HOST");
export const REDIS_PORT = getEnvVarAsInt("REDIS_PORT");
