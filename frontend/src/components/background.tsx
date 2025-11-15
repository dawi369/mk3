import { backgrounds, type BackgroundKey } from '@/config/backgrounds';

interface BackgroundProps {
  variant: BackgroundKey;
  children: React.ReactNode;
}

/**
 * Background wrapper component
 * 
 * Applies a configured background style to its children
 * Provides consistent structure and styling
 */
export function Background({ variant, children }: BackgroundProps) {
  const bg = backgrounds[variant];

  return (
    <div className="min-h-screen w-full relative">
      {/* Background layer */}
      <div
        className="absolute inset-0 z-0"
        style={bg.style}
      />
      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

