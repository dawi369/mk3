"use client";

import { ALL_MONTHS } from "@/lib/month-utils";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allOptions = ["Front", "All", ...ALL_MONTHS];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-0.5 px-1.5 py-0 text-[9px] font-medium text-muted-foreground border border-border/20 rounded bg-muted/5 hover:bg-muted/10 transition-colors"
      >
        {selectedMonth}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[80px] max-h-[200px] overflow-y-auto bg-card border border-border rounded-md shadow-lg">
          {allOptions.map((month) => (
            <button
              key={month}
              onClick={(e) => {
                e.stopPropagation();
                onMonthChange(month);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-[11px] hover:bg-muted/50 transition-colors",
                selectedMonth === month && "bg-muted text-foreground font-medium"
              )}
            >
              {month}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
