"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ConnectionProvider } from "@/providers/connection-provider";
import { DataProvider } from "@/providers/data-provider";
import { AppPostHogProvider } from "@/providers/posthog-provider";
import { GlobalBackground } from "@/components/common/global-background";
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
    <AppPostHogProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <ConnectionProvider>
            <DataProvider>
              {/* Global wavy dot background for all pages */}
              <GlobalBackground />
              {/* <TooltipProvider> */}
              {children}
              {/* </TooltipProvider> */}
            </DataProvider>
          </ConnectionProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppPostHogProvider>
  );
}
