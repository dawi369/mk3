function getEnvVar(key: string): string {
  const value = Bun.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarAsInt(key: string): number {
  const value = getEnvVar(key);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

// Parse REDIS_URL (Railway format) or fall back to REDIS_HOST/REDIS_PORT (local Docker)
function getRedisConfig(): { host: string; port: number; password?: string } {
  const redisUrl = Bun.env.REDIS_URL;
  if (redisUrl) {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
    };
  }
  return {
    host: getEnvVar("REDIS_HOST"),
    port: getEnvVarAsInt("REDIS_PORT"),
  };
}

const redisConfig = getRedisConfig();

export const POLYGON_API_KEY = getEnvVar("POLYGON_API_KEY");
export const POLYGON_API_URL = getEnvVar("POLYGON_API_URL");
export const HUB_PORT = getEnvVarAsInt("HUB_PORT");
export const REDIS_HOST = redisConfig.host;
export const REDIS_PORT = redisConfig.port;
export const REDIS_PASSWORD = redisConfig.password;
export const DATABASE_URL = getEnvVar("DATABASE_URL");
export const HUB_API_KEY = getEnvVar("HUB_API_KEY");
