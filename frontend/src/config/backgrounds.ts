/**
 * Background configurations for the application
 * 
 * Each background represents a different visual style
 * that can be applied to pages or sections
 */

export const backgrounds = {
  azureDepths: {
    name: 'Azure Depths',
    style: {
      background: 'radial-gradient(125% 125% at 50% 100%, #000000 40%, #010133 100%)',
    },
  },
  deepSpace: {
    name: 'Deep Space',
    style: {
      background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a24 100%)',
    },
  },
} as const;

export type BackgroundKey = keyof typeof backgrounds;

