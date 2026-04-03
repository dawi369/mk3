"use client";

import posthog from "posthog-js";
import { NEXT_PUBLIC_POSTHOG_KEY } from "@/config/env";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export const ANALYTICS_EVENTS = {
  waitlistSubmitted: "waitlist_submitted",
  loginMagicLinkRequested: "login_magic_link_requested",
  loginOAuthStarted: "login_oauth_started",
  pricingCtaClicked: "pricing_cta_clicked",
  featureRequestSubmitted: "feature_request_submitted",
} as const;

export function captureAnalyticsEvent(
  event: (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS],
  properties: AnalyticsProperties = {},
) {
  if (!NEXT_PUBLIC_POSTHOG_KEY) {
    return;
  }

  posthog.capture(event, properties);
}
