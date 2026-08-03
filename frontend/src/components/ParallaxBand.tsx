import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/motion'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type ParallaxBandProps = {
  children: ReactNode
  className?: string
  strength?: number
}

/** Kitchen Line–style background drift scrubbed to scroll. */
export function ParallaxBand({
  children,
  className,
  strength = 12,
}: ParallaxBandProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !rootRef.current || !layerRef.current) return

      gsap.fromTo(
        layerRef.current,
        { yPercent: -strength },
        {
          yPercent: strength,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    },
    { scope: rootRef, dependencies: [strength] },
  )

  return (
    <section ref={rootRef} className={className}>
      <div ref={layerRef} className="parallax-band__layer" aria-hidden="true" />
      <div className="parallax-band__content">{children}</div>
    </section>
  )
}
