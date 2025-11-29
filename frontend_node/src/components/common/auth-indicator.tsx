import { useState, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Fingerprint,
  Loader2,
  LogOut,
  User as UserIcon,
  CreditCard,
  Settings,
  Key,
  Lightbulb,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { updateDisplayName, type UserProfile } from "@/lib/supabase/profiles";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

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

export function AuthIndicator() {
  const { user, profile, loading, signOut, refreshProfile, updateProfile } =
    useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (dropdownOpen && user) {
      setEditedName(profile?.display_name || getDisplayName(user, profile));
    }
  }, [dropdownOpen, user, profile]);

  const handleSignOut = async () => {
    await signOut();
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

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !editedName.trim()) return;

    const newName = editedName.trim();
    const oldName = profile?.display_name;

    // Optimistic update
    updateProfile({ display_name: newName });
    setDropdownOpen(false);

    const success = await updateDisplayName(user.id, newName);
    if (success) {
      await refreshProfile();
    } else {
      // Revert on failure
      if (oldName) {
        updateProfile({ display_name: oldName });
      }
      await refreshProfile();
    }
  };

  const handleFeatureRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureRequest.trim()) return;
    // In a real app, you'd send this to an API
    console.log("Feature Request Submitted:", featureRequest);
    setFeatureRequest("");
    setDropdownOpen(false);
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
      <NavigationMenuLink
        asChild
        className={cn(
          navigationMenuTriggerStyle(),
          "focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        )}
      >
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
        className={cn(
          navigationMenuTriggerStyle(),
          "group focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        )}
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
            <p className="text-sm font-medium leading-none">
              {getDisplayName(user, profile)}
            </p>
            <p className="text-xs leading-snug text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer group">
              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Profile</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-2 w-64">
              <form onSubmit={handleSaveName} className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground px-1">
                  Display Name
                </span>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Your name"
                  className="h-8"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-7 px-3 w-full"
                >
                  Save Changes
                </button>
              </form>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem asChild>
            <Link
              href="/billing"
              className="cursor-pointer group w-full flex items-center"
            >
              <CreditCard className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/settings"
              className="cursor-pointer group w-full flex items-center"
            >
              <Settings className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          {/* <DropdownMenuItem className="cursor-pointer group">
            <Key className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>API Keys</span>
          </DropdownMenuItem> */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer group">
            <Lightbulb className="mr-2 h-4 w-4 text-indigo-400 group-hover:text-indigo-500 transition-colors" />
            <span>Feature Request</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-2 w-64">
            <form
              onSubmit={handleFeatureRequestSubmit}
              className="flex flex-col gap-2"
            >
              <span className="text-xs font-medium text-muted-foreground px-1">
                Share your feedback
              </span>
              <Input
                value={featureRequest}
                onChange={(e) => setFeatureRequest(e.target.value)}
                placeholder="I want..."
                className="h-8"
                onKeyDown={(e) => e.stopPropagation()}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-7 px-3 w-full"
              >
                Submit
              </button>
            </form>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
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
