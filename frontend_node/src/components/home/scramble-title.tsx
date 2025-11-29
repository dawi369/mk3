"use client";

import { useState, useEffect } from "react";
import { TextScramble } from "@/components/ui/text-scramble";

interface ScrambleTitleProps {
  children: string;
  className?: string;
  delay?: number;
}

export function ScrambleTitle({
  children,
  className,
  delay = 0,
}: ScrambleTitleProps) {
  const [trigger, setTrigger] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrigger(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <TextScramble
      className={className}
      as="span"
      trigger={trigger}
      loop={isHovering}
      onHoverStart={() => {
        setTrigger(true);
        setIsHovering(true);
      }}
      onHoverEnd={() => setIsHovering(false)}
      onScrambleComplete={() => setTrigger(false)}
    >
      {children}
    </TextScramble>
  );
}
