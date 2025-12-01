function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const NEXT_PUBLIC_SITE_URL = requireEnv(
  "NEXT_PUBLIC_SITE_URL",
  process.env.NEXT_PUBLIC_SITE_URL
);

export const NEXT_PUBLIC_SUPABASE_URL = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

export const NEXT_PUBLIC_SUPABASE_ANON_KEY = requireEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const NEXT_PUBLIC_REDIS_HOST = requireEnv(
  "NEXT_PUBLIC_REDIS_HOST",
  process.env.NEXT_PUBLIC_REDIS_HOST
);
export const NEXT_PUBLIC_REDIS_PORT = requireEnv(
  "NEXT_PUBLIC_REDIS_PORT",
  process.env.NEXT_PUBLIC_REDIS_PORT
);





export const NEXT_PUBLIC_HUB_REST_URL = requireEnv(
  "NEXT_PUBLIC_HUB_REST_URL",
  process.env.NEXT_PUBLIC_HUB_REST_URL
);

export const NEXT_PUBLIC_HUB_WS_URL = requireEnv(
  "NEXT_PUBLIC_HUB_WS_URL",
  process.env.NEXT_PUBLIC_HUB_WS_URL
);
