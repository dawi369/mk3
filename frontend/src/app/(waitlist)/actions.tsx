"use server";

import React from "react";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { WaitlistEmail } from "./email-template";

export type WaitlistResult = {
  success: boolean;
  message: string;
};

export async function addToWaitlist(email: string): Promise<WaitlistResult> {
  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("waitlist").insert({ email });

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
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Swordfish <onboarding@resend.dev>", // TODO: Update with your verified domain
      to: email,
      subject: "Welcome to the Swordfish Waitlist",
      react: <WaitlistEmail email={email} />,
    });
  } catch (emailError) {
    console.error("Resend email error:", emailError);
    // We don't fail the request if email fails, as the DB insert was successful
  }

  return { success: true, message: "You're on the list! We'll be in touch soon." };
}
