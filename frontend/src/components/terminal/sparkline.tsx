"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = "currentColor",
  className,
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length === 0) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero
    const padding = range * 0.1; // 10% padding
    const paddedMin = min - padding;
    const paddedMax = max + padding;
    const paddedRange = paddedMax - paddedMin;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - paddedMin) / paddedRange) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  const lastPoint = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Re-calculate last point coordinates to match the path
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = range * 0.1;
    const paddedMin = min - padding;
    const paddedMax = max + padding;
    const paddedRange = paddedMax - paddedMin;

    const val = data[data.length - 1];
    const x = width;
    const y = height - ((val - paddedMin) / paddedRange) * height;

    return { x, y };
  }, [data, width, height]);

  return (
    <div className={cn("relative flex items-center", className)} style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <path
          d={path}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {lastPoint && (
          <>
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="2"
              fill={color}
              className="animate-pulse"
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="4"
              fill={color}
              opacity="0.2"
              className="animate-ping"
            />
          </>
        )}
      </svg>
    </div>
  );
}
