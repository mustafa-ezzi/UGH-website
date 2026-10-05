import { type ReactNode } from 'react'

type SmoothScrollProviderProps = {
  children: ReactNode
}

/** Native scroll only — Lenis smooth-scroll was removed for performance. */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  return children
}
