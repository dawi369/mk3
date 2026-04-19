"use client";

import * as React from "react";
import { CalendarSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RANGE_PRESETS, type RangePresetId } from "@/lib/chart-utils";

interface ChartRangeSelectorProps {
  activePreset: RangePresetId | null;
  onRangePresetChange: (id: RangePresetId | "custom") => void;
  onCalendarOpen?: () => void;
}

export function ChartRangeSelector({
  activePreset,
  onRangePresetChange,
  onCalendarOpen,
}: ChartRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <ToggleGroup
        type="single"
        value={activePreset ?? ""}
        onValueChange={(val) =>
          onRangePresetChange(val ? (val as RangePresetId) : "custom")
        }
        className="bg-transparent p-0 gap-0.5"
      >
        {RANGE_PRESETS.map((preset) => (
          <ToggleGroupItem
            key={preset.id}
            value={preset.id}
            size="sm"
            className="h-6 px-2 text-[11px] font-medium data-[state=on]:bg-white/10 data-[state=on]:text-foreground hover:bg-white/5 transition-colors"
          >
            {preset.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-white/5"
        onClick={onCalendarOpen}
      >
        <CalendarSearch className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
