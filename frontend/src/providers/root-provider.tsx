"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ConnectionProvider } from "@/providers/connection-provider";
import { DataProvider } from "@/providers/data-provider";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useUIStore } from "@/store/use-ui-store";
// import { TooltipProvider } from "@/components/ui/tooltip"; // Uncomment when Tooltip is available

export function RootProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setIsHoveringBackground } = useUIStore();

  // Reset hover state on every navigation to prevent stuck interactions
  useEffect(() => {
    setIsHoveringBackground(false);
  }, [pathname, setIsHoveringBackground]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>
        <ConnectionProvider>
          <DataProvider>
            {/* <TooltipProvider> */}
            {children}
            {/* </TooltipProvider> */}
          </DataProvider>
        </ConnectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
