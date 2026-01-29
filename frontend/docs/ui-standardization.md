# UI Standardization

This document outlines the effort to standardize "popout" UI elements (dropdowns, tooltips, hover cards, etc.) across the application to ensure a consistent look and feel.

## The Standard

The application uses **Radix UI** primitives via `src/components/ui/navigation-menu.tsx` as the source of truth for dropdown styling.

**Standard Classes:**
*   **Container Background:** `bg-muted`
*   **Text Color:** `text-foreground`
*   **Border:** `border` (relies on default theme border color, usually `border-border`)
*   **Shadow:** `shadow`
*   **Border Radius:** `rounded-md`

## Why `bg-muted`?
Using `bg-muted` ensures that popover elements distinctively sit "above" the base page content (which is usually black or `bg-background`) without being stark white in dark mode. It provides a subtle tonal difference (often a dark gray).

## Guidelines for New Components

When creating new overlay or popout components:

1.  **Prefer Radix UI**: Use `@radix-ui` primitives (e.g., `HoverCard`, `Popover`, `DropdownMenu`) wrapped in the project's standard pattern found in `src/components/ui`.
2.  **Match the Classes**: If implementing a custom component (like `Tooltip` in `components/ui/tooltip-card.tsx`), ensure the container uses the standard classes listed above instead of hardcoded colors like `bg-neutral-900`.
3.  **Avoid Hardcoded Colors**: Do not use `bg-white` or `bg-black`. Use semantic theme tokens (`bg-background`, `bg-muted`, `bg-card`) to ensure proper theming support.

## Migration Status

*   **Navigation Menu**: ✅ Standardized (Source of Truth)
*   **Tooltip Card**: ✅ Standardized (Updated to match Navigation Menu styles)
