import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/motion'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  /** Stagger child selectors inside this container */
  staggerChildren?: string
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  staggerChildren,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return

      if (prefersReducedMotion()) {
        gsap.set(el, { clearProps: 'all' })
        if (staggerChildren) {
          gsap.set(el.querySelectorAll(staggerChildren), { clearProps: 'all' })
        }
        return
      }

      if (staggerChildren) {
        const targets = el.querySelectorAll(staggerChildren)
        gsap.from(targets, {
          opacity: 0,
          y,
          duration: 0.75,
          ease: 'power2.out',
          stagger: 0.08,
          delay,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        })
        return
      }

      gsap.from(el, {
        opacity: 0,
        y,
        duration: 0.85,
        ease: 'power2.out',
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      })
    },
    { scope: ref, dependencies: [delay, y, staggerChildren] },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
