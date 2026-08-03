import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/motion'

gsap.registerPlugin(ScrollTrigger)

type SmoothScrollProviderProps = {
  children: ReactNode
}

function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(hover: none), (pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0
  )
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    // Mobile/touch: keep native scrolling. Lenis + pinned ScrollTriggers
    // often eat touch gestures and feel broken on phones.
    if (prefersReducedMotion() || isTouchDevice()) {
      ScrollTrigger.config({ ignoreMobileResize: true })
      ScrollTrigger.refresh()
      return
    }

    const lenis = new Lenis({
      duration: 1.35,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
      wheelMultiplier: 0.9,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tickerCallback)
      lenis.destroy()
    }
  }, [])

  return children
}
