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

// Resend email configuration
export const RESEND_API_KEY = requireEnv("RESEND_API_KEY", process.env.RESEND_API_KEY);

export const FEATURE_REQUEST_EMAIL = requireEnv(
  "FEATURE_REQUEST_EMAIL",
  process.env.FEATURE_REQUEST_EMAIL
);
