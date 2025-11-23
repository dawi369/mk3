"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
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
  Sparkles,
  ChevronDown,
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

export function AuthIndicator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={navigationMenuTriggerStyle()}>
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <UserIcon className="w-3 h-3 text-primary" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-background"></span>
          </div>
          <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline-block">
            {user.email?.split("@")[0]}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">My Account</p>
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
