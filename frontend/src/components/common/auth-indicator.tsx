import { useState } from "react";
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
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { type UserProfile } from "@/lib/supabase/profiles";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { ANALYTICS_EVENTS, captureAnalyticsEvent } from "@/lib/analytics";


const getDisplayName = (user: User, profile: UserProfile | null): string => {
  // Prefer first_name from profile (populated by trigger from OAuth)
  if (profile?.first_name) {
    return profile.first_name;
  }
  // Fallback to user metadata from OAuth provider
  if (user.user_metadata?.given_name) {
    return user.user_metadata.given_name;
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
  const { user, profile, loading, signOut } = useAuth();
  const [featureRequest, setFeatureRequest] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSignOut = async () => {
    await signOut();
  };



  const handleFeatureRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureRequest.trim()) return;

    setIsSendingRequest(true);
    setRequestStatus("idle");

    try {
      const response = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureRequest: featureRequest.trim(),
          userName: getDisplayName(user!, profile),
          userEmail: user?.email,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send feature request");
      }

      setFeatureRequest("");
      setRequestStatus("success");
      captureAnalyticsEvent(ANALYTICS_EVENTS.featureRequestSubmitted, {
        source: "auth_indicator",
        has_user: true,
      });

      // Reset status after 3 seconds
      setTimeout(() => setRequestStatus("idle"), 3000);
    } catch (error) {
      console.error("Feature request error:", error);
      setRequestStatus("error");

      // Reset status after 3 seconds
      setTimeout(() => setRequestStatus("idle"), 3000);
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <motion.div layout className="relative flex items-center justify-end">
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={navigationMenuTriggerStyle()}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </motion.div>
        ) : !user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Link href="/login" className={navigationMenuTriggerStyle()}>
              <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <Fingerprint className="w-4 h-4" />
                <span className="font-medium">Login</span>
              </div>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center"
          >
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
                        <p className="text-sm font-medium leading-none">
                          {getDisplayName(user, profile)}
                        </p>
                        <p className="text-xs leading-snug text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="grid gap-2">

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
                              className={cn(
                                "h-8 text-xs bg-muted/50 border-white/10 focus-visible:ring-primary/20 transition-all duration-300",
                                requestStatus === "success" && "border-green-500/50 bg-green-500/5",
                                requestStatus === "error" && "border-red-500/50 bg-red-500/5"
                              )}
                              onKeyDown={(e) => e.stopPropagation()}
                              disabled={isSendingRequest || requestStatus !== "idle"}
                            />
                            <button
                              type="submit"
                              disabled={isSendingRequest || requestStatus !== "idle"}
                              className={cn(
                                "inline-flex items-center justify-center rounded-md text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none h-8 px-3 min-w-[52px]",
                                requestStatus === "idle" &&
                                  "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 disabled:opacity-50",
                                requestStatus === "success" &&
                                  "bg-green-500/20 text-green-500 border border-green-500/30",
                                requestStatus === "error" &&
                                  "bg-red-500/20 text-red-500 border border-red-500/30"
                              )}
                            >
                              <AnimatePresence mode="wait">
                                {isSendingRequest ? (
                                  <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                  >
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  </motion.div>
                                ) : requestStatus === "success" ? (
                                  <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </motion.div>
                                ) : requestStatus === "error" ? (
                                  <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </motion.div>
                                ) : (
                                  <motion.span
                                    key="send"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                  >
                                    Send
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </button>
                          </form>
                          {/* Status message */}
                          <AnimatePresence>
                            {requestStatus !== "idle" && (
                              <motion.p
                                initial={{ opacity: 0, y: -5, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -5, height: 0 }}
                                className={cn(
                                  "text-[10px] font-medium",
                                  requestStatus === "success" && "text-green-500",
                                  requestStatus === "error" && "text-red-500"
                                )}
                              >
                                {requestStatus === "success"
                                  ? "Thanks for your feedback! 🎉"
                                  : "Failed to send. Please try again."}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Theme Toggle */}
                        {/* <div className="pt-2 border-t border-white/10">
                          <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                            <span className="text-sm font-medium">Theme</span>
                            <ThemeToggle />
                          </div>
                        </div> */}

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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
