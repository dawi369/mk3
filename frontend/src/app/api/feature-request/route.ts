import { Resend } from "resend";
import { NextResponse } from "next/server";
import { RESEND_API_KEY, FEATURE_REQUEST_EMAIL } from "@/config/env.server";

const resend = new Resend(RESEND_API_KEY);

// Your email address where you want to receive feature requests
const YOUR_EMAIL = FEATURE_REQUEST_EMAIL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { featureRequest, userName, userEmail } = body;

    if (!featureRequest?.trim()) {
      return NextResponse.json({ error: "Feature request is required" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Swordfish <onboarding@resend.dev>", // Use your verified domain later
      to: YOUR_EMAIL,
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
          
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px;">
            <h4 style="margin-top: 0; color: #666;">User Information</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${userName || "Not provided"}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail || "Not provided"}</p>
            <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            This feature request was submitted via the Swordfish dashboard.
          </p>
        </div>
      `,
      text: `
        New Feature Request from ${userName || "Anonymous User"}
        
        Request: ${featureRequest}
        
        User Name: ${userName || "Not provided"}
        User Email: ${userEmail || "Not provided"}
        Submitted: ${new Date().toLocaleString()}
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
