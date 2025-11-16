import type { FC } from "react";
import { BackgroundProps } from "@/types/bg.types";

export const Background: FC<BackgroundProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative">
      <div
        className="fixed inset-0 bg-black -z-10"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
};
