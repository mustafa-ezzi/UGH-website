import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/motion'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export type StorySlide = {
  id: string
  eyebrow: string
  title: string
  body: string
  cta: string
  href: string
  image: string
}

type KitchenLineStoryProps = {
  slides: StorySlide[]
}

/**
 * Fixed/sticky full-bleed backgrounds — scroll continues, each screen reveals the next photo.
 * Inspired by Kitchen Line’s full-bleed product story panels.
 */
export function KitchenLineStory({ slides }: KitchenLineStoryProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)

  useGSAP(
    () => {
      if (!rootRef.current || slides.length === 0) return

      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const index = Math.min(
            slides.length - 1,
            Math.max(0, Math.floor(self.progress * slides.length - 0.0001)),
          )
          if (index !== activeRef.current) {
            activeRef.current = index
            setActive(index)
          }
        },
      })

      return () => st.kill()
    },
    { scope: rootRef, dependencies: [slides.length] },
  )

  const slide = slides[active] ?? slides[0]
  if (!slide) return null

  return (
    <section
      ref={rootRef}
      className="kl-story"
      style={{ ['--kl-slides' as string]: slides.length }}
      aria-label="Product stories"
    >
      <div className="kl-story__sticky">
        {slides.map((item, index) => (
          <div
            key={item.id}
            className={`kl-story__bg${index === active ? ' is-active' : ''}`}
            style={{ backgroundImage: `url(${item.image})` }}
            aria-hidden={index !== active}
          />
        ))}
        <div className="kl-story__wash" aria-hidden="true" />

        <div className="kl-story__content u-container">
          <p className="kl-story__eyebrow">{slide.eyebrow}</p>
          <h2 className="kl-story__title" key={`t-${slide.id}`}>
            {slide.title}
          </h2>
          <p className="kl-story__body" key={`b-${slide.id}`}>
            {slide.body}
          </p>
          <Link to={slide.href} className="btn-ember">
            {slide.cta}
          </Link>
        </div>

        <div className="kl-story__dots" role="tablist" aria-label="Story slides">
          {slides.map((item, index) => (
            <span
              key={item.id}
              className={`kl-story__dot${index === active ? ' is-active' : ''}`}
              role="presentation"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

type HeroCarouselProps = {
  slides: StorySlide[]
}

/** Auto-advancing full-bleed carousel — Kitchen Line “JUST NEWLY ARRIVED”. */
export function KitchenLineCarousel({ slides }: HeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const reduce = prefersReducedMotion()

  useEffect(() => {
    if (reduce || slides.length < 2) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 5500)
    return () => window.clearInterval(id)
  }, [reduce, slides.length])

  if (!slides.length) return null
  const slide = slides[index]

  return (
    <section className="kl-carousel" aria-roledescription="carousel" aria-label="Newly arrived">
      {slides.map((item, i) => (
        <div
          key={item.id}
          className={`kl-carousel__slide${i === index ? ' is-active' : ''}`}
          style={{ backgroundImage: `url(${item.image})` }}
          aria-hidden={i !== index}
        />
      ))}
      <div className="kl-carousel__wash" aria-hidden="true" />
      <div className="kl-carousel__content u-container">
        <p className="kl-carousel__eyebrow">{slide.eyebrow}</p>
        <h2 className="kl-carousel__title">{slide.title}</h2>
        <p className="kl-carousel__body">{slide.body}</p>
        <Link to={slide.href} className="btn-ember">
          {slide.cta}
        </Link>
      </div>
      <div className="kl-carousel__controls">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
        >
          Prev
        </button>
        <div className="kl-carousel__dots">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={i === index ? 'is-active' : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => setIndex((i) => (i + 1) % slides.length)}
        >
          Next
        </button>
      </div>
    </section>
  )
}
