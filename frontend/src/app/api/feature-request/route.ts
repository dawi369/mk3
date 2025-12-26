import { Resend } from "resend";
import { NextResponse } from "next/server";
import { RESEND_API_KEY, FEATURE_REQUEST_EMAIL } from "@/config/env.server";
import { createClient } from "@/utils/supabase/server";
import type { SubscriptionRow } from "@/types/billing.types";

const resend = new Resend(RESEND_API_KEY);

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { featureRequest, userName, userEmail, userId } = body;

    if (!featureRequest?.trim()) {
      return NextResponse.json({ error: "Feature request is required" }, { status: 400 });
    }

    // Fetch subscription data if userId is provided
    let subscription: SubscriptionRow | null = null;
    if (userId) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        subscription = data as SubscriptionRow;
      }
    }

    const { data, error } = await resend.emails.send({
      from: "Swordfish <onboarding@resend.dev>",
      to: FEATURE_REQUEST_EMAIL,
      subject: `Swordfish Feature Request from ${userName || "Anonymous User"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            🐟 New Feature Request
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #6366f1;">Request Details</h3>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              ${featureRequest}
            </p>
          </div>
          
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="margin-top: 0; color: #666;">User Information</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${userName || "Not provided"}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail || "Not provided"}</p>
            <p style="margin: 5px 0;"><strong>User ID:</strong> ${userId || "Not provided"}</p>
            <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          ${
            subscription
              ? `
          <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;">
            <h4 style="margin-top: 0; color: #6366f1;">Subscription Details</h4>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #666;"><strong>Tier:</strong></td><td style="padding: 4px 0;">${
                subscription.tier?.toUpperCase() || "N/A"
              }</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Provider:</strong></td><td style="padding: 4px 0;">${
                subscription.provider || "N/A"
              }</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Status:</strong></td><td style="padding: 4px 0;">${
                subscription.status || "N/A"
              }</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Period Start:</strong></td><td style="padding: 4px 0;">${formatDate(
                subscription.current_period_start
              )}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Period End:</strong></td><td style="padding: 4px 0;">${formatDate(
                subscription.current_period_end
              )}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Cancel at Period End:</strong></td><td style="padding: 4px 0;">${
                subscription.cancel_at_period_end ? "Yes" : "No"
              }</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Canceled At:</strong></td><td style="padding: 4px 0;">${formatDate(
                subscription.canceled_at
              )}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Payment Method:</strong></td><td style="padding: 4px 0;">${
                subscription.payment_method_brand || "N/A"
              } (${subscription.payment_method_type || "N/A"})</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Created:</strong></td><td style="padding: 4px 0;">${formatDate(
                subscription.created_at
              )}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Updated:</strong></td><td style="padding: 4px 0;">${formatDate(
                subscription.updated_at
              )}</td></tr>
            </table>
          </div>
          `
              : `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">No subscription found for this user.</p>
          </div>
          `
          }
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            This feature request was submitted via the Swordfish dashboard.
          </p>
        </div>
      `,
      text: `
New Feature Request from ${userName || "Anonymous User"}

REQUEST:
${featureRequest}

USER INFO:
- Name: ${userName || "Not provided"}
- Email: ${userEmail || "Not provided"}
- User ID: ${userId || "Not provided"}
- Submitted: ${new Date().toLocaleString()}

SUBSCRIPTION:
${
  subscription
    ? `
- Tier: ${subscription.tier || "N/A"}
- Provider: ${subscription.provider || "N/A"}
- Status: ${subscription.status || "N/A"}
- Period Start: ${formatDate(subscription.current_period_start)}
- Period End: ${formatDate(subscription.current_period_end)}
- Cancel at Period End: ${subscription.cancel_at_period_end ? "Yes" : "No"}
- Canceled At: ${formatDate(subscription.canceled_at)}
- Payment Method: ${subscription.payment_method_brand || "N/A"} (${
        subscription.payment_method_type || "N/A"
      })
- Created: ${formatDate(subscription.created_at)}
- Updated: ${formatDate(subscription.updated_at)}
`
    : "No subscription found"
}
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Feature request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
