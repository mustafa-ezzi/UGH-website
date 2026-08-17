import { Link } from 'react-router-dom'
import { useSettings } from '../api/hooks'
import { Reveal } from '../components/Reveal'
import { StatusMessage } from '../components/StatusMessage'
import { displaySiteName, HOUSE_BRAND } from '../lib/brand'

const PHOTOS = {
  hero: '/about-fair-ovens.jpg',
  partnership: '/about-partnership.jpg',
  chimney: '/about-chimney.jpg',
  meeting: '/about-meeting.jpg',
} as const

export function AboutPage() {
  const settings = useSettings()
  const siteName = displaySiteName(settings.data?.site_name)
  const tagline = settings.data?.tagline || 'Precision born from heat.'
  const about =
    settings.data?.about_blurb ||
    `${HOUSE_BRAND} showcases refined kitchen appliances — catalogue first, enquiry when you are ready.`

  return (
    <div className="about">
      <section className="about-hero" aria-label="About hero">
        <div className="about-hero__media">
          <img
            src={PHOTOS.hero}
            alt="Reviewing built-in ovens with partners at an international trade fair"
          />
        </div>
        <div className="about-hero__wash" aria-hidden="true" />
        <div className="about-hero__copy u-container">
          <p className="about-hero__brand">{siteName}</p>
          <h1 className="about-hero__title">Built on real kitchens, real partners</h1>
          <p className="about-hero__lede">{tagline}</p>
        </div>
      </section>

      <section className="about-intro page-shell--mist">
        <div className="u-container about-intro__inner">
          {settings.isLoading ? (
            <StatusMessage title="Loading…" />
          ) : settings.isError ? (
            <StatusMessage tone="error" title="Could not load brand details" />
          ) : (
            <Reveal>
              <p className="u-eyebrow" style={{ color: 'var(--ugh-ember)' }}>
                Our story
              </p>
              <h2 className="about-intro__title">{about}</h2>
              <p className="about-intro__body">
                We travel the world&apos;s appliance floors — from Canton Fair halls to quiet
                meeting rooms — to bring home kitchens products that earn their place. Catalogue
                first. Enquire when you are ready.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      <section className="about-split">
        <Reveal className="about-split__media">
          <img
            src={PHOTOS.partnership}
            alt="Handshake with an international appliance partner at Canton Fair"
            loading="lazy"
          />
        </Reveal>
        <Reveal className="about-split__copy" delay={0.08}>
          <p className="u-eyebrow" style={{ color: 'var(--ugh-ember)' }}>
            Partnership
          </p>
          <h2>Trust, sealed face to face</h2>
          <p>
            Long relationships start with a handshake in a busy aisle — then become the pieces and
            finishes you see in our catalogue.
          </p>
        </Reveal>
      </section>

      <section className="about-band" aria-label="Chimneys and hoods">
        <div className="about-band__media">
          <img
            src={PHOTOS.chimney}
            alt="Reviewing a kitchen chimney and hob with partners at a trade exhibition"
            loading="lazy"
          />
        </div>
        <div className="about-band__wash" aria-hidden="true" />
        <Reveal className="about-band__copy u-container">
          <p className="u-eyebrow" style={{ color: 'var(--ugh-flame)' }}>
            At the fair
          </p>
          <h2>Where appliances meet people</h2>
          <p>
            On the show floor we stand with makers, compare finishes under real light, and choose
            what belongs in a serious kitchen — ovens, hobs, chimneys, and the details between.
          </p>
        </Reveal>
      </section>

      <section className="about-split about-split--reverse about-split--portrait">
        <Reveal className="about-split__media">
          <img
            src={PHOTOS.meeting}
            alt="Smart kitchen solutions meeting with partners reviewing appliances"
            loading="lazy"
          />
        </Reveal>
        <Reveal className="about-split__copy" delay={0.08}>
          <p className="u-eyebrow" style={{ color: 'var(--ugh-ember)' }}>
            Beyond the booth
          </p>
          <h2>Quiet rooms. Clear decisions.</h2>
          <p>
            Away from the crowd, we sit with partners over samples and specs — so every piece we
            show is chosen with care, not noise.
          </p>
          <Link to="/catalogue" className="btn-ember about-split__cta">
            Browse the catalogue
          </Link>
        </Reveal>
      </section>

      <section className="about-close page-shell--mist">
        <Reveal className="u-container about-close__inner">
          <p className="u-eyebrow" style={{ color: 'var(--ugh-ember)' }}>
            Next step
          </p>
          <h2>Ready to talk about your kitchen?</h2>
          <p>Tell us what you need — we respond with availability and honest guidance.</p>
          <div className="about-close__actions">
            <Link to="/contact" className="btn-ember">
              Contact us
            </Link>
            <Link to="/catalogue" className="about-close__ghost">
              View products
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
