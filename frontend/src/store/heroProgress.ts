import { create } from 'zustand'

type HeroProgressState = {
  progress: number
  chapter: number
  setProgress: (progress: number) => void
}

/** Map 0–1 scroll progress to chapter index (0–5). */
export function progressToChapter(progress: number): number {
  if (progress < 0.1) return 0
  if (progress < 0.28) return 1
  if (progress < 0.48) return 2
  if (progress < 0.65) return 3
  if (progress < 0.82) return 4
  return 5
}

export const useHeroProgress = create<HeroProgressState>((set) => ({
  progress: 0,
  chapter: 0,
  setProgress: (progress) => {
    const clamped = Math.min(1, Math.max(0, progress))
    set({
      progress: clamped,
      chapter: progressToChapter(clamped),
    })
  },
}))
