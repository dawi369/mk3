import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/terminal";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has a profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let destination = next;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          destination = "/onboarding";
        }
      }

      const isLocalEnv = process.env.NODE_ENV === "development";
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer

      if (isLocalEnv) {
        // we can be stricter about redirects on production
        return NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
