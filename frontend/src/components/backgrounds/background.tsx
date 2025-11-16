import type { FC } from "react";
import { BackgroundProps } from "@/types/bg.types";

const backgrounds = {
  solid: "bg-background",
  gradient: "radial-gradient(125% 125% at 50% 100%, #000000 40%, #010133 100%)",
  horizon: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #0d1a36 100%)",
};

export const Background: FC<BackgroundProps> = ({ 
  children, 
  variant = "solid" 
}) => {
  const isGradient = variant !== "solid";
  
  return (
    <div className="min-h-screen w-full relative">
      <div
        className="fixed inset-0 -z-10"
        style={isGradient ? { background: backgrounds[variant] } : undefined}
        aria-hidden="true"
      >
        {!isGradient && <div className="absolute inset-0 bg-background" />}
      </div>
      <div className="relative flex flex-col min-h-screen text-foreground">
        {children}
      </div>
    </div>
  );
};

