"use client";
import { type JSX, useEffect, useState } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type TextScrambleProps = {
  children: string;
  duration?: number;
  speed?: number;
  characterSet?: string;
  as?: React.ElementType;
  className?: string;
  trigger?: boolean;
  onScrambleComplete?: () => void;
  loop?: boolean;
} & MotionProps;

const defaultChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = defaultChars,
  className,
  as: Component = "p",
  trigger = true,
  onScrambleComplete,
  loop = false,
  ...props
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);
  const text = children;

  useEffect(() => {
    if (!trigger && !loop) return;

    let interval: NodeJS.Timeout;
    let startTime: number;
    const length = text.length;

    setIsAnimating(true);
    startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);

      if (loop) {
        const nextText = text
          .split("")
          .map((char) => {
            if (char === " ") return char;
            return characterSet[
              Math.floor(Math.random() * characterSet.length)
            ];
          })
          .join("");
        setDisplayText(nextText);
        return;
      }

      if (progress === 1) {
        setDisplayText(text);
        setIsAnimating(false);
        onScrambleComplete?.();
        clearInterval(interval);
        return;
      }

      const nextText = text
        .split("")
        .map((char, index) => {
          if (char === " ") return char;
          if (index < length * progress) {
            return char;
          }
          return characterSet[Math.floor(Math.random() * characterSet.length)];
        })
        .join("");

      setDisplayText(nextText);
    };

    interval = setInterval(animate, speed * 1000);

    return () => clearInterval(interval);
  }, [trigger, loop, text, duration, speed, characterSet, onScrambleComplete]);

  const MotionComponent = motion.create(Component as any);

  return (
    <MotionComponent className={cn(className)} {...props}>
      {displayText}
    </MotionComponent>
  );
}
