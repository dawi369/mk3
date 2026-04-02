import * as Sentry from "@sentry/nextjs";
import { NEXT_PUBLIC_SENTRY_DSN } from "@/config/env";
import { SENTRY_DSN } from "@/config/env.server";

const serverDsn = SENTRY_DSN ?? NEXT_PUBLIC_SENTRY_DSN;
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1");

export async function register() {
  if (!serverDsn) {
    return;
  }

  Sentry.init({
    dsn: serverDsn,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate,
  });
}

export const onRequestError = Sentry.captureRequestError;
