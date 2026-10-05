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
  // Keep dust readable without dominating CPU/GPU
  if (isMobileViewport()) return 1600
  return 3200
}
