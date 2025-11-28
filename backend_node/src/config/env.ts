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
export const POLYGON_API_URL = getEnvVar("POLYGON_API_URL");
export const HUB_REST_PORT = getEnvVarAsInt("HUB_REST_PORT");
export const REDIS_HOST = getEnvVar("REDIS_HOST");
export const REDIS_PORT = getEnvVarAsInt("REDIS_PORT");
export const DATABASE_URL = getEnvVar("DATABASE_URL");
export const SUPABASE_JWT_SECRET = getEnvVar("SUPABASE_JWT_SECRET");
export const HUB_API_KEY = getEnvVar("HUB_API_KEY");
