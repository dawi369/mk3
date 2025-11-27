/**
 * Animation configurations and demo data for home/marketing page
 */

export const ANIMATION_CONFIG = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
} as const;

export const SCRAMBLE_DELAYS = {
  futures: 200,
  tools: 400,
  need: 600,
  change: 800,
} as const;

export const DEMO_CHART_HEIGHTS = [
  40, 65, 45, 80, 55, 70, 40, 60, 50, 75, 60, 85, 70, 90, 65,
] as const;

export const STATS_DATA = [
  {
    value: "100+",
    label: "Global Futures Products",
  },
  {
    value: "Full",
    label: "L1/L2 Order Book",
  },
  {
    value: "AI-Driven",
    label: "Edge",
  },
] as const;
