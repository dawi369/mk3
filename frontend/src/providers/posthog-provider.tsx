"use client";

import { NEXT_PUBLIC_POSTHOG_HOST, NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN } from "@/config/env";
import { PostHogProvider } from "posthog-js/react";

const posthogOptions = {
  api_host: NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  autocapture: process.env.NODE_ENV === "production",
  capture_pageleave: true,
  capture_pageview: true,
  disable_session_recording: true,
  person_profiles: "identified_only" as const,
};

export function AppPostHogProvider({ children }: { children: React.ReactNode }) {
  if (!NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider apiKey={NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN} options={posthogOptions}>
      {children}
    </PostHogProvider>
  );
}
