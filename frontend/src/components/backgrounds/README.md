# Background Component

A flexible background component that supports multiple visual styles.

## Usage

### In Root Layout (Default)

```tsx
import { Background } from "@/components/backgrounds/background";

<Background variant="solid">
  <Header />
  <main>{children}</main>
  <Footer />
</Background>
```

### Available Variants

1. **`solid`** (default) - Pure black background
   ```tsx
   <Background variant="solid">{children}</Background>
   ```

2. **`gradient`** - Azure depths gradient (bottom glow)
   ```tsx
   <Background variant="gradient">{children}</Background>
   ```

3. **`horizon`** - Dark horizon glow (top glow)
   ```tsx
   <Background variant="horizon">{children}</Background>
   ```

## Future: Per-Page Backgrounds

For pages that need different backgrounds, use Next.js layouts:

### Option 1: Route Group Layouts

Create a layout for specific routes:

```
app/
├── layout.tsx              # Root layout (default background)
├── (marketing)/
│   ├── layout.tsx         # Marketing pages with gradient
│   └── about/
│       └── page.tsx
└── dashboard/
    ├── layout.tsx         # Dashboard with horizon variant
    └── page.tsx
```

Example `app/(marketing)/layout.tsx`:
```tsx
import { Background } from "@/components/backgrounds/background";

export default function MarketingLayout({ children }) {
  return (
    <Background variant="gradient">
      {children}
    </Background>
  );
}
```

### Option 2: Page-Level Control (Future Enhancement)

If you need per-page background control, you can use context:

```tsx
// Create a BackgroundContext
const BackgroundContext = createContext<BackgroundVariant>('solid');

// In layout, read from context
<Background variant={variant}>

// In page, set variant
export default function Page() {
  return (
    <BackgroundProvider variant="horizon">
      <YourContent />
    </BackgroundProvider>
  );
}
```

## Extending with Custom Variants

Add new variants in `background.tsx`:

```tsx
const backgrounds = {
  solid: "bg-black",
  gradient: "radial-gradient(...)",
  horizon: "radial-gradient(...)",
  custom: "your-gradient-here", // Add new variants
};

export type BackgroundVariant = 'solid' | 'gradient' | 'horizon' | 'custom';
```

## Technical Details

- Background is **fixed** and doesn't scroll with content
- Uses `-z-10` to stay behind all content
- Wraps children in a flex container with `min-h-screen`
- Automatically applies `text-white` for visibility
- No nesting - only one Background per page

## Best Practices

✅ **DO:**
- Use in root layout for consistent app-wide background
- Use route groups for section-specific backgrounds
- Keep variants simple and performant

❌ **DON'T:**
- Nest Background components
- Render Background inside page components
- Use inline styles - extend the variants object instead

