"use server";

import React from "react";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { WaitlistEmail } from "./email-template";
import {
  RESEND_API_KEY,
  WAITLIST_RATE_LIMIT_MAX,
  WAITLIST_RATE_LIMIT_WINDOW_MS,
} from "@/config/env.server";
import { enforceRateLimit, isValidEmail } from "@/lib/server/request-guard";

export type WaitlistResult = {
  success: boolean;
  message: string;
};

export async function addToWaitlist(email: string): Promise<WaitlistResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  if (normalizedEmail.length > 320) {
    return { success: false, message: "Please enter a valid email address." };
  }

  try {
    await enforceRateLimit({
      key: "waitlist",
      max: WAITLIST_RATE_LIMIT_MAX,
      windowMs: WAITLIST_RATE_LIMIT_WINDOW_MS,
    });
  } catch (error) {
    return {
      success: false,
      message: "Too many requests. Please wait a minute and try again.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("waitlist").insert({ email: normalizedEmail });

  if (error) {
    // Unique constraint violation (duplicate email)
    if (error.code === "23505") {
      return { success: true, message: "You're already on the waitlist!" };
    }
    console.error("Waitlist insert error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  // Send confirmation email via Resend
  try {
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: "Swordfish <onboarding@resend.dev>", // TODO: Update with your verified domain
      to: normalizedEmail,
      subject: "Welcome to the Swordfish Waitlist",
      react: <WaitlistEmail email={normalizedEmail} />,
    });
  } catch (emailError) {
    console.error("Resend email error:", emailError);
    // We don't fail the request if email fails, as the DB insert was successful
  }

  return { success: true, message: "You're on the list! We'll be in touch soon." };
}
