"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Terminal, Activity, Scale, Sparkles, Settings, Search, FlaskConical } from "lucide-react";
import {
  useSpotlight,
  SpotlightCommand,
} from "@/components/terminal/layout/spotlight/spotlight-provider";

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
      {
        id: "action-search-symbol",
        label: "Search Symbol...",
        icon: <Search className="size-4" />,
        shortcut: "/",
        group: "Actions",
        action: () => {
          // TODO: Switch to symbol search mode
          console.log("Symbol search...");
          close();
        },
      },
    ],
    [router, close]
  );
}

export function Spotlight() {
  const { isOpen, close, toggle, commands, registerCommands, unregisterCommands } = useSpotlight();
  const defaultCommands = useDefaultCommands();

  // Register default commands on mount
  useEffect(() => {
    registerCommands(defaultCommands);
    return () => {
      unregisterCommands(defaultCommands.map((c) => c.id));
    };
  }, [defaultCommands, registerCommands, unregisterCommands]);

  // Keyboard shortcut handler - Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  // Group commands by their group property
  const groupedCommands = useMemo(() => {
    const groups: Record<string, SpotlightCommand[]> = {};
    for (const cmd of commands) {
      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, [commands]);

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => !open && close()}
      title="Command Palette"
      description="Search for commands, navigate, or perform actions."
      showCloseButton={false}
      className="border-white/20 bg-card/95 backdrop-blur-lg max-w-lg"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([group, cmds]) => (
          <CommandGroup key={group} heading={group}>
            {cmds.map((cmd) => (
              <CommandItem key={cmd.id} onSelect={cmd.action} className="cursor-pointer">
                {cmd.icon}
                <span>{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>⌘{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
