import { createClient } from "@/utils/supabase/client";

export interface UserProfile {
  id: string;
  display_name: string | null;
  tier: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch user profile from profiles table
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, tier, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    // Silently return null if table doesn't exist or user not found
    // This allows graceful fallback to default name
    if (error.code === "PGRST116" || error.code === "42P01") {
      // PGRST116: No rows returned, 42P01: Table doesn't exist
      return null;
    }
    console.warn("Error fetching user profile:", error.message || error);
    return null;
  }

  return data;
}

/**
 * Update user's display name in profiles table
 */
export async function updateDisplayName(userId: string, displayName: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);

  if (error) {
    console.warn("Error updating display name:", error.message || error);
    return false;
  }

  return true;
}

/**
 * Ensure user has a profile, create if doesn't exist
 * Silently fails if table doesn't exist
 * @returns true if profile was newly created, false if it already existed or on error
 */
export async function ensureUserProfile(userId: string, email?: string): Promise<boolean> {
  const supabase = createClient();

  try {
    // Check if profile exists
    const { data: existing, error: selectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      console.error("Error checking profile:", selectError);
      return false;
    }

    if (!existing) {
      // Create profile with default name and email
      const profileData: any = {
        id: userId,
        display_name: "Trader",
      };

      // Add email if provided
      if (email) {
        profileData.email = email;
      }

      const { error: insertError } = await supabase.from("profiles").insert(profileData);

      if (insertError) {
        // 23505 = duplicate key, which means profile already exists (race condition)
        if (insertError.code === "23505") {
          console.log("Profile already exists for user:", userId);
          return false;
        }

        console.error("Error creating profile - Full error:", insertError);
        console.error("Error code:", insertError.code);
        console.error("Error message:", insertError.message);
        console.error("This might be due to RLS policies. Check Supabase RLS settings.");
        return false;
      } else {
        console.log("Profile created successfully for user:", userId);
        return true; // New profile was created
      }
    }

    return false; // Profile already existed
  } catch (error) {
    // Silently fail if table doesn't exist - user will get default name from getDisplayName
    console.error("Error in ensureUserProfile:", error);
    return false;
  }
}
