import { cn } from "@/lib/utils";

interface BackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "grid" | "gradient"; // Extensible for future
}

export function Background({
  children,
  className,
  variant = "solid",
}: BackgroundProps) {
  return (
    <div className="relative min-h-screen w-full">
      {/* Fixed Background Layer */}
      <div className="fixed inset-0 -z-10 h-full w-full">
        {/* Solid Variant (Default) */}
        {variant === "solid" && (
          <div className="absolute inset-0 bg-background transition-colors duration-300" />
        )}

        {/* Grid Variant (Placeholder/Example) */}
        {variant === "grid" && (
          <div className="absolute inset-0 bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
        )}

        {/* Gradient Variant (Placeholder) */}
        {variant === "gradient" && (
          <div className="absolute inset-0 bg-linear-to-b from-background to-background/80" />
        )}
      </div>

      {/* Content Layer */}
      <div className={cn("relative z-0", className)}>{children}</div>
    </div>
  );
}
