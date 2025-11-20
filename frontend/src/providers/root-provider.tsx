"use client";

import { ThemeProvider } from "@/providers/theme-provider";
// import { TooltipProvider } from "@/components/ui/tooltip"; // Uncomment when Tooltip is available

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {/* <TooltipProvider> */}
      {children}
      {/* </TooltipProvider> */}
    </ThemeProvider>
  );
}
