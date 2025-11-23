export const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL as string;

export const NEXT_PUBLIC_SUPABASE_URL = process.env
  .NEXT_PUBLIC_SUPABASE_URL as string;

export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env
  .NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Optional: Validate existence
if (typeof window !== "undefined") {
  if (!NEXT_PUBLIC_SITE_URL) {
    console.error("Missing NEXT_PUBLIC_SITE_URL");
  }
  if (!NEXT_PUBLIC_SUPABASE_URL) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}
