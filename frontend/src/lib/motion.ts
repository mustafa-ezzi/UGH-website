export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches
}

export function particleBudget(): number {
  if (prefersReducedMotion()) return 0
  // Crowded field — mobile still high enough to read as dense dust
  if (isMobileViewport()) return 4800
  return 9200
}
