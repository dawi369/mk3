import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import {
  getUserProfile,
  ensureUserProfile,
  type UserProfile,
} from "@/lib/supabase/profiles";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchProfile = useCallback(
    async (userId: string, email?: string) => {
      try {
        // Run ensure and get in parallel
        const [isNewUser, userProfile] = await Promise.all([
          ensureUserProfile(userId, email).catch((e: any) => {
            console.error("Error ensuring profile:", e);
            return false;
          }),
          getUserProfile(userId).catch((e: any) => {
            console.error("Error fetching profile:", e);
            return null;
          }),
        ]);

        setProfile(userProfile);

        if (isNewUser) {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error in profile fetch:", error);
      }
    },
    [router]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const userProfile = await getUserProfile(user.id).catch((e: any) => {
      console.error("Error refreshing profile:", e);
      return null;
    });
    setProfile(userProfile);
  }, [user]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
  }, [supabase, router]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          // console.error("Error fetching initial user:", error);
          // Don't log error for no session, just set null
        }

        setUser(user);

        if (user) {
          await fetchProfile(user.id, user.email || undefined);
        }
      } catch (error) {
        console.error("Unexpected error in auth init:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;

      // Only update if user changed to avoid unnecessary profile fetches
      if (currentUser?.id !== user?.id) {
        setUser(currentUser);
        if (currentUser) {
          setLoading(true); // Briefly show loading while profile fetches on switch
          await fetchProfile(currentUser.id, currentUser.email || undefined);
          setLoading(false);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, user?.id]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
