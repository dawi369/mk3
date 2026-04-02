import * as Sentry from "@sentry/bun";

const dsn = Bun.env.SENTRY_DSN;
const tracesSampleRate = Number(Bun.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1");

export const sentryEnabled = Boolean(dsn);

export function initSentry() {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: Bun.env.NODE_ENV === "production",
    tracesSampleRate,
    serverName: "mk3-backend",
  });
}

export async function flushSentry(timeoutMs = 2000) {
  if (!sentryEnabled) {
    return;
  }

  await Sentry.flush(timeoutMs);
}

export { Sentry };
