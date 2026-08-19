import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { progressToChapter, useHeroProgress } from '../store/heroProgress'
import { isMobileViewport, prefersReducedMotion } from '../lib/motion'
import { GradientWaves } from '../scenes/GradientWaves'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const HeroScene = lazy(() =>
  import('../scenes/HeroScene').then((m) => ({ default: m.HeroScene })),
)

type CinematicHeroProps = {
  siteName: string
  tagline: string
  support: string
}

const CHAPTER_COPY = [
  { eyebrow: 'United Gas & Home Appliances', title: 'UGH', body: '' },
  { eyebrow: 'From dust', title: 'Precision', body: 'born from heat.' },
  { eyebrow: 'Form', title: 'Crafted', body: 'Dust gathers into quiet light.' },
  { eyebrow: 'Material', title: 'Steel & flame', body: 'Brush, heat, and control.' },
  { eyebrow: 'Reveal', title: 'Your kitchen', body: 'Catalogue first — enquire when ready.' },
  { eyebrow: 'Continue', title: 'Explore', body: 'Stoves · Chimneys · Ovens · Basins' },
] as const

function smoothstep(x: number, min: number, max: number) {
  if (x <= min) return 0
  if (x >= max) return 1
  const t = (x - min) / (max - min)
  return t * t * (3 - 2 * t)
}

export function CinematicHero({ siteName, tagline, support }: CinematicHeroProps) {
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const rootRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const handoffRef = useRef<HTMLParagraphElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [chapter, setChapter] = useState(0)
  const [showCta, setShowCta] = useState(false)
  const [showScrollCue, setShowScrollCue] = useState(true)
  const chapterRef = useRef(0)
  const ctaRef = useRef(false)
  const scrollCueRef = useRef(true)

  useGSAP(
    () => {
      if (reduced || !rootRef.current || !pinRef.current) {
        useHeroProgress.getState().setProgress(1)
        setChapter(5)
        setShowCta(true)
        setShowScrollCue(false)
        return
      }

      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: '+=420%',
        pin: pinRef.current,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress
          useHeroProgress.getState().setProgress(p)

          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${p})`
          }

          const nextChapter = progressToChapter(p)
          if (nextChapter !== chapterRef.current) {
            chapterRef.current = nextChapter
            setChapter(nextChapter)
          }

          const nextCta = p > 0.72
          if (nextCta !== ctaRef.current) {
            ctaRef.current = nextCta
            setShowCta(nextCta)
          }

          const nextCue = p < 0.12
          if (nextCue !== scrollCueRef.current) {
            scrollCueRef.current = nextCue
            setShowScrollCue(nextCue)
          }

          const handoff = handoffRef.current
          if (handoff) {
            const t = smoothstep(p, 0.78, 0.95)
            handoff.style.opacity = String(t)
            handoff.style.transform = `translate(-50%, ${(1 - t) * 24}px)`
          }
        },
      })

      return () => {
        st.kill()
        useHeroProgress.getState().setProgress(0)
      }
    },
    { scope: rootRef, dependencies: [reduced] },
  )

  if (reduced) {
    return (
      <section className="cinematic-hero cinematic-hero--static" aria-label="United Gas & Home Appliances hero">
        <div className="cinematic-hero__static-bg" aria-hidden="true" />
        <div className="cinematic-hero__overlay cinematic-hero__overlay--static">
          <div className="cinematic-hero__copy">
            <h1 className="cinematic-hero__title">UGH</h1>
            <p className="cinematic-hero__tagline">{tagline}</p>
            <p className="cinematic-hero__support">{support}</p>
            <Link to="/catalogue" className="btn-ember cinematic-hero__cta">
              Explore the catalogue
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const copy = CHAPTER_COPY[Math.min(chapter, CHAPTER_COPY.length - 1)]

  return (
    <section
      ref={rootRef}
      className="cinematic-hero"
      aria-label="Cinematic introduction"
    >
      <div ref={pinRef} className="cinematic-hero__pin">
        <GradientWaves
          className="cinematic-hero__waves"
          horizonColor="#0e1116"
          waveColor="#c45c26"
          crestColor="#e8d5b5"
          speed={0.28}
          amplitude={2.1}
          waveScale={0.55}
          waveRatio={0.9}
          swell={32}
          turbulence={18}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={15}
          detail={isMobileViewport() ? 'low' : 'medium'}
          brightness={0.82}
          opacity={0.8}
          mouseInteraction
          parallaxStrength={0.35}
          grain
          grainIntensity={0.04}
        />
        <Suspense fallback={<div className="cinematic-hero__fallback" aria-hidden="true" />}>
          <HeroScene className="cinematic-hero__canvas" />
        </Suspense>

        <div className="cinematic-hero__vignette" aria-hidden="true" />

        <div className="cinematic-hero__overlay">
          <div className="cinematic-hero__copy">
            <p className="u-eyebrow cinematic-hero__eyebrow">{copy.eyebrow || siteName}</p>
            <h1 className="cinematic-hero__title" key={`title-${chapter}`}>
              {chapter === 0 ? 'UGH' : copy.title}
            </h1>
            <p className="cinematic-hero__body" key={`body-${chapter}`}>
              {chapter === 0 ? tagline : copy.body || support}
            </p>
            {showCta ? (
              <Link to="/catalogue" className="btn-ember cinematic-hero__cta">
                Explore the catalogue
              </Link>
            ) : null}
          </div>

          {showScrollCue ? (
            <div className="cinematic-hero__scroll motion-safe-only" aria-hidden="true">
              <span>Scroll · hover the dust</span>
              <span className="cinematic-hero__scroll-line" />
            </div>
          ) : null}
        </div>

        <div className="cinematic-hero__progress" aria-hidden="true">
          <div ref={progressBarRef} className="cinematic-hero__progress-bar" />
        </div>

        <p ref={handoffRef} className="cinematic-hero__handoff" aria-hidden="true">
          Enter the catalogue
        </p>
      </div>
    </section>
  )
}
