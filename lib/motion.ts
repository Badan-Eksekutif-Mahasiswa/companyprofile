export const MOTION = {
  ease: [0.16, 1, 0.3, 1] as const,
  duration: { fast: 0.15, base: 0.22, slow: 0.38, reveal: 0.9 },
  reveal: {
    y: 24,
    stagger: 70,
    threshold: 0.12,
  },
  lerp: 0.1,
  smoothScroll: { duration: 1.2, wheelMultiplier: 1 },
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
