"use client";

import * as React from "react";
import Link from "next/link";
import {
  CircleCheckIcon,
  CircleHelpIcon,
  CircleIcon,
  Fingerprint,
} from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];

export function Navbar() {
  const isMobile = useIsMobile();

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList className="flex-wrap">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="opacity-60 hover:opacity-100 transition-opacity">
            Features
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full flex-col justify-end rounded-md p-4 no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md hover:bg-foreground/10 focus:bg-foreground/10 md:p-6"
                    href="/terminal"
                  >
                    <div className="mb-2 text-lg font-bold font-space text-foreground group-hover:text-primary transition-colors">
                      Terminal
                    </div>
                    <p className="text-muted-foreground text-sm leading-tight font-mono">
                      Beautifully designed, lightning fast.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="/terminal" title="Indicators">
                Actionable insights.
              </ListItem>
              <ListItem href="/terminal" title="Market Sentiment">
                Feel the market.
              </ListItem>
              <ListItem href="/ai-lab" title="AI Lab">
                See what the data sees.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link
              href="/mission"
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              Mission
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link
              href="/pricing"
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              Pricing
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/login">
              <span className="inline-flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                Login
              </span>
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* <li className="flex items-center">
          <LatencyIndicator />
        </li> */}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="hover:bg-foreground/10 focus:bg-foreground/10"
        >
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
