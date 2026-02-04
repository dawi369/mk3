"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Terminal, Activity, Scale, Sparkles, Settings, FlaskConical } from "lucide-react";
import {
  useSpotlight,
  SpotlightCommand,
} from "@/components/terminal/layout/spotlight/spotlight-provider";
import { useTickerStore } from "@/store/use-ticker-store";
import type { TickerSearchResult } from "@/types/ticker.types";
import type { Bar } from "@/types/common.types";

function summarizeVolume(bars?: Bar[]): number {
  if (!bars || bars.length === 0) return 0;
  return bars.reduce((sum, bar) => sum + (bar.volume || 0), 0);
}

function searchTickers(
  query: string,
  entities: Record<string, { symbol: string; name: string; latestBar?: Bar }>,
  series: Record<string, Bar[]>,
): TickerSearchResult[] {
  if (!query) return [];
  const q = query.toUpperCase();

  const results: TickerSearchResult[] = [];

  for (const entity of Object.values(entities)) {
    const symbol = entity.symbol.toUpperCase();
    const name = entity.name.toUpperCase();
    if (!symbol.includes(q) && !name.includes(q)) continue;

    const bars = series[entity.symbol];
    const latest = entity.latestBar || bars?.[bars.length - 1];
    const base = bars?.[0]?.open || latest?.open || latest?.close || 0;
    const lastPrice = latest?.close || 0;
    const change = base ? lastPrice - base : 0;
    const changePercent = base ? change / base : 0;
    const volume = summarizeVolume(bars) || latest?.volume || 0;

    let rank = 3;
    if (symbol === q) rank = 0;
    else if (symbol.startsWith(q)) rank = 1;
    else if (name.includes(q)) rank = 2;

    results.push({
      symbol: entity.symbol,
      name: entity.name,
      lastPrice,
      change,
      changePercent,
      volume,
      rank,
    });
  }

  return results.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return b.volume - a.volume;
  });
}

// Default navigation commands available in all views
function useDefaultCommands(): SpotlightCommand[] {
  const router = useRouter();
  const { close } = useSpotlight();

  return useMemo(
    () => [
      {
        id: "nav-terminal",
        label: "Go to Terminal",
        icon: <Terminal className="size-4" />,
        shortcut: "T",
        group: "Navigation",
        action: () => {
          router.push("/terminal?view=terminal");
          close();
        },
      },
      {
        id: "nav-backtesting",
        label: "Go to Backtesting",
        icon: <FlaskConical className="size-4" />,
        shortcut: "B",
        group: "Navigation",
        action: () => {
          router.push("/backtesting");
          close();
        },
      },
      {
        id: "nav-sentiment",
        label: "Go to Sentiment",
        icon: <Scale className="size-4" />,
        shortcut: "S",
        group: "Navigation",
        action: () => {
          router.push("/terminal?view=sentiment");
          close();
        },
      },
      {
        id: "nav-ailab",
        label: "Go to AI Lab",
        icon: <Sparkles className="size-4" />,
        shortcut: "A",
        group: "Navigation",
        action: () => {
          router.push("/terminal?view=ai-lab");
          close();
        },
      },
      {
        id: "action-settings",
        label: "Open Settings",
        icon: <Settings className="size-4" />,
        group: "Actions",
        action: () => {
          router.push("/settings");
          close();
        },
      },
    ],
    [router, close]
  );
}

export function Spotlight() {
  const { isOpen, mode: spotlightMode, open, openWithMode, close, toggle, commands, registerCommands, unregisterCommands } = useSpotlight();
  const mode = useTickerStore((state) => state.mode);
  const entities = useTickerStore((state) => state.entitiesByMode[mode]);
  const series = useTickerStore((state) => state.seriesByMode[mode]);
  const isModalOpen = useTickerStore((state) => state.isModalOpen);
  const openPrimary = useTickerStore((state) => state.openPrimary);
  const addComparison = useTickerStore((state) => state.addComparison);
  const defaultCommands = useDefaultCommands();
  
  // Prevent hydration mismatch - Radix Dialog generates different IDs on server vs client
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [tickerResults, setTickerResults] = useState<TickerSearchResult[]>([]);

  // Register default commands on mount
  useEffect(() => {
    setMounted(true);
    registerCommands(defaultCommands);
    return () => {
      unregisterCommands(defaultCommands.map((c) => c.id));
    };
  }, [defaultCommands, registerCommands, unregisterCommands]);

  // Handle ticker search
  useEffect(() => {
    if (query) {
      const results = searchTickers(query, entities, series);
      setTickerResults(results);
    } else {
      setTickerResults([]);
    }
  }, [query, entities, series]);

  // Keyboard shortcut handler - Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle spotlight
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isModalOpen) {
          openWithMode("ticker-compare");
        } else {
          toggle();
        }
        return;
      }
      
      // Global type-to-search
      // If not in an input, and typing a letter/number, open spotlight with that char
      if (
        !isOpen &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1 &&
        /^[a-zA-Z0-9]$/.test(e.key) &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        // e.preventDefault(); // Optional: might prevent typing in the newly opened input if we're not careful
        open();
        setQuery(e.key);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggle, open, openWithMode, isModalOpen]);

  // Group commands by their group property
  const groupedCommands = useMemo(() => {
    const groups: Record<string, SpotlightCommand[]> = {};
    for (const cmd of commands) {
      // Filter commands if query exists (simple local filter for non-ticker commands)
      if (query && !cmd.label.toLowerCase().includes(query.toLowerCase()) && !cmd.group.toLowerCase().includes(query.toLowerCase())) {
        continue;
      }

      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, [commands, query]);

  // Don't render dialog on server - prevents Radix ID hydration mismatch
  if (!mounted) return null;

  const handleTickerSelect = (t: TickerSearchResult) => {
    if (isModalOpen || spotlightMode === "ticker-compare") {
      addComparison(t.symbol);
    } else {
      openPrimary(t.symbol);
    }
    close();
    setQuery("");
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close();
          setQuery("");
        }
      }}
      title="Command Palette"
      description="Search for commands, navigate, or perform actions."
      showCloseButton={false}
      showOverlay={!isModalOpen}
      className="border-white/20 bg-card/95 backdrop-blur-lg max-w-m!"
    >
      <CommandInput 
        placeholder={
          spotlightMode === "ticker-compare" || isModalOpen
            ? "Add a symbol to compare..."
            : "Type a command or search..."
        }
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[500px]">
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Ticker Results */}
        {tickerResults.length > 0 && (
          <CommandGroup heading="Tickers">
            {tickerResults.map((t) => (
              <CommandItem 
                key={`ticker-${t.symbol}`} 
                onSelect={() => handleTickerSelect(t)} 
                className="cursor-pointer flex justify-between items-center"
                value={`ticker-${t.symbol} ${t.name}`} // Ensure value helps with filtering/selection
              >
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <span className="font-bold">{t.symbol}</span>
                  <span className="text-muted-foreground text-xs">{t.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                   <span>{t.lastPrice ? t.lastPrice.toLocaleString() : "--"}</span>
                   <span className={t.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {t.changePercent >= 0 ? "+" : ""}{(t.changePercent * 100).toFixed(2)}%
                   </span>
                 </div>
               </CommandItem>
             ))}
          </CommandGroup>
        )}

        {/* Regular Commands */}
        {Object.entries(groupedCommands).map(([group, cmds]) => (
          <CommandGroup key={group} heading={group}>
            {cmds.map((cmd) => (
              <CommandItem key={cmd.id} onSelect={cmd.action} className="cursor-pointer" value={cmd.label}>
                {cmd.icon}
                <span>{cmd.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
