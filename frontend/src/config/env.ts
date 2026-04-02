function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export const NEXT_PUBLIC_SITE_URL = requireEnv(
  "NEXT_PUBLIC_SITE_URL",
  process.env.NEXT_PUBLIC_SITE_URL,
);

export const NEXT_PUBLIC_SUPABASE_URL = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const NEXT_PUBLIC_SUPABASE_ANON_KEY = requireEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const NEXT_PUBLIC_HUB_URL = requireEnv(
  "NEXT_PUBLIC_HUB_URL",
  process.env.NEXT_PUBLIC_HUB_URL,
);

export const NEXT_PUBLIC_SENTRY_DSN = getOptionalEnv(process.env.NEXT_PUBLIC_SENTRY_DSN);
export const NEXT_PUBLIC_POSTHOG_KEY = getOptionalEnv(process.env.NEXT_PUBLIC_POSTHOG_KEY);
export const NEXT_PUBLIC_POSTHOG_HOST = getOptionalEnv(process.env.NEXT_PUBLIC_POSTHOG_HOST);
