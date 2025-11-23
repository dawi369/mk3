"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fingerprint,
  Loader2,
  LogOut,
  User as UserIcon,
  CreditCard,
  Settings,
  Key,
  Sparkles,
  ChevronDown,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  getUserProfile,
  updateDisplayName,
  ensureUserProfile,
  type UserProfile,
} from "@/lib/supabase/profiles";

export function AuthIndicator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Ensure profile exists and fetch it
        const isNewUser = await ensureUserProfile(
          user.id,
          user.email || undefined
        );
        const userProfile = await getUserProfile(user.id);
        setProfile(userProfile);

        // Redirect new users to onboarding
        if (isNewUser) {
          router.push("/onboarding");
        }
      }

      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const isNewUser = await ensureUserProfile(
          session.user.id,
          session.user.email || undefined
        );
        const userProfile = await getUserProfile(session.user.id);
        setProfile(userProfile);

        // Redirect new users to onboarding
        if (isNewUser) {
          router.push("/onboarding");
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    // Delay closing to allow mouse to move to dropdown content
    closeTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const getDisplayName = (user: User, profile: UserProfile | null): string => {
    // Priority: profile.display_name > OAuth first name > "Trader"
    if (profile?.display_name) {
      return profile.display_name.split(" ")[0];
    }

    // Extract first name from OAuth metadata
    if (user.user_metadata?.name) {
      return user.user_metadata.name.split(" ")[0];
    }
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(" ")[0];
    }

    return "Trader";
  };

  const handleEditName = () => {
    setEditedName(profile?.display_name || getDisplayName(user!, profile));
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;

    const success = await updateDisplayName(user.id, editedName.trim());
    if (success) {
      const updated = await getUserProfile(user.id);
      setProfile(updated);
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  if (loading) {
    return (
      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </NavigationMenuLink>
    );
  }

  if (!user) {
    return (
      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
        <Link href="/login">
          <motion.span
            className="inline-flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Login</span>
          </motion.span>
        </Link>
      </NavigationMenuLink>
    );
  }

  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      modal={false}
    >
      <DropdownMenuTrigger
        className={`${navigationMenuTriggerStyle()} group focus:ring-0 focus:outline-none focus-visible:ring-0`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <UserIcon className="w-3 h-3 text-primary" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-background"></span>
          </div>
          <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline-block">
            {getDisplayName(user, profile)}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50 ml-1 transition duration-300 group-data-[state=open]:rotate-180" />
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 p-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Display name"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 hover:bg-accent rounded"
                  title="Save"
                >
                  <Check className="h-3 w-3 text-green-500" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-accent rounded"
                  title="Cancel"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium leading-none">
                  {getDisplayName(user, profile)}
                </p>
                <button
                  onClick={handleEditName}
                  className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit name"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )}
            <p className="text-xs leading-snug text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer group">
            <UserIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer group">
            <CreditCard className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer group">
            <Settings className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer group">
            <Key className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>API Keys</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer group">
          <Sparkles className="mr-2 h-4 w-4 text-indigo-400 group-hover:text-indigo-500 transition-colors" />
          <span>Feature Request</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
