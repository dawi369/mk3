"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ConnectionProvider } from "@/providers/connection-provider";
import { DataProvider } from "@/providers/data-provider";
// import { TooltipProvider } from "@/components/ui/tooltip"; // Uncomment when Tooltip is available

export function RootProvider({ children }: { children: React.ReactNode }) {
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
