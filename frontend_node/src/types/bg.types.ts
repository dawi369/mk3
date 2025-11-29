export type BackgroundVariant = 'solid' | 'gradient' | 'horizon';

export interface BackgroundProps {
  children: React.ReactNode;
  variant?: BackgroundVariant;
}
  