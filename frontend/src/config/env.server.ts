/**
 * Server-only environment variables.
 * These are NOT exposed to the browser and should only be imported in API routes or server components.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string, value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

// Resend email configuration
export const RESEND_API_KEY = requireEnv("RESEND_API_KEY", process.env.RESEND_API_KEY);

export const FEATURE_REQUEST_EMAIL = requireEnv(
  "FEATURE_REQUEST_EMAIL",
  process.env.FEATURE_REQUEST_EMAIL
);

export const MASSIVE_API_KEY = getOptionalEnv("MASSIVE_API_KEY", process.env.MASSIVE_API_KEY);
export const SENTRY_DSN = getOptionalEnv("SENTRY_DSN", process.env.SENTRY_DSN);
