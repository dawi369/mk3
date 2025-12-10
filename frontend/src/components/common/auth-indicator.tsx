import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Fingerprint,
  Loader2,
  LogOut,
  User as UserIcon,
  CreditCard,
  Settings,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { updateDisplayName, type UserProfile } from "@/lib/supabase/profiles";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/common/theme-toggle";

const getDisplayName = (user: User, profile: UserProfile | null): string => {
  if (profile?.display_name) {
    return profile.display_name.split(" ")[0];
  }
  if (user.user_metadata?.name) {
    return user.user_metadata.name.split(" ")[0];
  }
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name.split(" ")[0];
  }
  return "Trader";
};

type AlignmentType = "left" | "center" | "right";

interface AuthIndicatorProps {
  align?: AlignmentType;
}

export function AuthIndicator({ align = "left" }: AuthIndicatorProps) {
  const { user, profile, loading, signOut, refreshProfile, updateProfile } = useAuth();
  const [editedName, setEditedName] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedName(profile?.display_name || getDisplayName(user, profile));
    }
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !editedName.trim()) return;

    setIsSavingName(true);
    const newName = editedName.trim();
    const oldName = profile?.display_name;

    // Optimistic update
    updateProfile({ display_name: newName });

    try {
      const success = await updateDisplayName(user.id, newName);
      if (success) {
        await refreshProfile();
        toast.success("Profile name updated");
      } else {
        throw new Error("Failed to update name");
      }
    } catch (error) {
      // Revert on failure
      if (oldName) {
        updateProfile({ display_name: oldName });
      }
      await refreshProfile();
      toast.error("Failed to update name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleFeatureRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureRequest.trim()) return;

    setIsSendingRequest(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Feature Request Submitted:", featureRequest);
    setFeatureRequest("");
    setIsSendingRequest(false);
    toast.success("Feature request sent!");
  };

  if (loading) {
    return (
      <div className={navigationMenuTriggerStyle()}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className={navigationMenuTriggerStyle()}>
        <motion.span
          className="inline-flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Login</span>
        </motion.span>
      </Link>
    );
  }

  return (
    // bg-zinc-900??
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="opacity-60 hover:opacity-100 transition-opacity group">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <UserIcon className="w-3 h-3 text-primary" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-background"></span>
              </div>
              <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline-block">
                {getDisplayName(user, profile)}
              </span>
            </div>
          </NavigationMenuTrigger>
          <NavigationMenuContent
            className={cn(
              align === "right" && "right-0 left-auto",
              align === "center" && "left-1/2 -translate-x-1/2",
              align === "left" && "left-0 right-auto"
            )}
          >
            <div className="grid gap-3 p-4 w-[300px] md:w-[350px]">
              {/* User Info Header */}
              <div className="flex flex-col space-y-1 pb-2 border-b border-white/10">
                <p className="text-sm font-medium leading-none">{getDisplayName(user, profile)}</p>
                <p className="text-xs leading-snug text-muted-foreground truncate">{user.email}</p>
              </div>

              <div className="grid gap-2">
                {/* Profile / Name Edit */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <UserIcon className="w-3 h-3" /> Profile
                  </h4>
                  <form onSubmit={handleSaveName} className="flex gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Display Name"
                      className="h-8 text-xs bg-muted/50 border-white/10 focus-visible:ring-primary/20"
                      onKeyDown={(e) => e.stopPropagation()}
                      disabled={isSavingName}
                    />
                    <button
                      type="submit"
                      disabled={isSavingName}
                      className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-8 px-3"
                    >
                      {isSavingName ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                    </button>
                  </form>
                </div>

                {/* Links */}
                <div className="grid grid-cols-2 gap-2">
                  <NavigationMenuLink asChild>
                    <Link
                      href="/billing"
                      className="group flex items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      Billing
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/settings"
                      className="group flex items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      Settings
                    </Link>
                  </NavigationMenuLink>
                </div>

                {/* Feature Request */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Lightbulb className="w-3 h-3 text-primary" /> Feature Request
                  </h4>
                  <form onSubmit={handleFeatureRequestSubmit} className="flex gap-2">
                    <Input
                      value={featureRequest}
                      onChange={(e) => setFeatureRequest(e.target.value)}
                      placeholder="I want..."
                      className="h-8 text-xs bg-muted/50 border-white/10 focus-visible:ring-primary/20"
                      onKeyDown={(e) => e.stopPropagation()}
                      disabled={isSendingRequest}
                    />
                    <button
                      type="submit"
                      disabled={isSendingRequest}
                      className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-8 px-3"
                    >
                      {isSendingRequest ? <Loader2 className="h-3 w-3 animate-spin" /> : "Send"}
                    </button>
                  </form>
                </div>

                {/* Theme Toggle */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                    <span className="text-sm font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>

                {/* Sign Out */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
