"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Fingerprint, Loader2, LogOut, User as UserIcon } from "lucide-react";
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
          <span className="inline-flex items-center gap-2">
            <Fingerprint className="w-4 h-4" />
            Login
          </span>
        </Link>
      </NavigationMenuLink>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={navigationMenuTriggerStyle()}>
        <span className="text-sm font-medium inline-flex items-center gap-2">
          <UserIcon className="w-4 h-4" />
          {user.email}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
