import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL,
} from "@/config/env";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const STATIC_PATHS = new Set(["/manifest.json", "/robots.txt", "/sitemap.xml"]);
const WAITLIST_PATH = "/waitlist";

function parseHost(hostHeader: string | null): string {
  if (!hostHeader) return "";
  const rawHost = hostHeader.split(",")[0]?.trim() ?? "";
  return rawHost.split(":")[0]?.toLowerCase() ?? "";
}

function getCanonicalHost(): string {
  try {
    return new URL(NEXT_PUBLIC_SITE_URL).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function parseHosts(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = parseHost(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  );

  const canonicalHost = getCanonicalHost();
  const extraAllowedHosts = parseHosts(process.env.WAITLIST_ALLOWED_HOSTS);
  const extraWaitlistHosts = parseHosts(process.env.WAITLIST_HOSTS);
  const isLocalHost = LOCAL_HOSTS.has(hostname);
  const isWaitlistHost =
    hostname.startsWith("waitlist.") ||
    hostname.startsWith("waitlist-") ||
    extraWaitlistHosts.includes(hostname) ||
    (canonicalHost && hostname === canonicalHost);
  const waitlistOnly = process.env.WAITLIST_ONLY === "true";
  const allowedHosts = new Set([
    ...LOCAL_HOSTS,
    ...extraAllowedHosts,
    ...extraWaitlistHosts,
  ]);
  if (canonicalHost) {
    allowedHosts.add(canonicalHost);
  }

  if (
    process.env.NODE_ENV === "production" &&
    canonicalHost &&
    hostname &&
    !allowedHosts.has(hostname)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.hostname = canonicalHost;
    redirectUrl.protocol = "https:";
    redirectUrl.port = "";
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (url.pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  if (!STATIC_PATHS.has(url.pathname)) {
    const shouldForceWaitlist = isWaitlistHost || (waitlistOnly && !isLocalHost);
    if (shouldForceWaitlist && url.pathname !== WAITLIST_PATH) {
      url.pathname = WAITLIST_PATH;
      return NextResponse.rewrite(url);
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - this ensures sessions are restored from cookies
  await supabase.auth.getUser();

  return supabaseResponse;
}
