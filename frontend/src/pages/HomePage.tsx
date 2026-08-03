import { Link } from 'react-router-dom'
import { useCategories, useProducts, useSettings } from '../api/hooks'
import { CinematicHero } from '../components/CinematicHero'
import {
  KitchenLineCarousel,
  KitchenLineStory,
  type StorySlide,
} from '../components/KitchenLineStory'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { StatusMessage } from '../components/StatusMessage'

const STORY_SLIDES: StorySlide[] = [
  {
    id: 'hob',
    eyebrow: 'Just newly arrived',
    title: 'Perfect hob for perfect cook',
    body: 'Discover our wide range of built-in hobs from well-known global brands.',
    cta: 'Discover more',
    href: '/catalogue/stoves-hobs',
    image:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'hood',
    eyebrow: 'Just newly arrived',
    title: 'Make your life easier with a good hood',
    body: 'Clear harmful vapor and keep your kitchen clean with quiet, powerful extraction.',
    cta: 'Discover more',
    href: '/catalogue/chimneys-hoods',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'oven',
    eyebrow: 'Just newly arrived',
    title: 'You will love cooking with our multi-function ovens',
    body: "Don't compromise on getting a perfect oven — precision heat, beautiful finish.",
    cta: 'Discover more',
    href: '/catalogue/ovens',
    image:
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'sink',
    eyebrow: 'Just newly arrived',
    title: 'Keep organized with the suitable sink',
    body: 'Choose the correct sink and basin for your kitchen from our wide range.',
    cta: 'Discover more',
    href: '/catalogue/sinks-basins',
    image:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'imagine',
    eyebrow: 'Just in UGH Appliances',
    title: 'Shape your imagination',
    body: 'We will draw your imagination — then help you execute it perfectly.',
    cta: 'Explore catalogue',
    href: '/catalogue',
    image:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=2000&q=80',
  },
]

const categoryAccents = [
  'linear-gradient(135deg, #1c1a17 0%, #3a2a1f 55%, #c45c26 160%)',
  'linear-gradient(135deg, #141210 0%, #2a3038 50%, #8a9199 140%)',
  'linear-gradient(135deg, #0a0908 0%, #2c241c 60%, #b8956c 150%)',
  'linear-gradient(135deg, #181614 0%, #243038 55%, #c5ccd3 140%)',
  'linear-gradient(135deg, #12100e 0%, #3a2818 50%, #e8a05c 145%)',
]

export function HomePage() {
  const settings = useSettings()
  const categories = useCategories()
  const featured = useProducts({ featured: true })

  const tagline = settings.data?.tagline ?? 'Precision born from heat.'
  const support =
    settings.data?.hero_supporting_text ??
    'Stoves, chimneys, ovens, and basins — crafted for kitchens that mean something.'
  const quote =
    settings.data?.homepage_quote?.trim() ||
    'Everything is designed. Few things are designed well.'
  const quoteLines = quote.includes('.')
    ? (() => {
        const idx = quote.indexOf('.')
        const first = quote.slice(0, idx + 1).trim()
        const rest = quote.slice(idx + 1).trim()
        return rest ? [first, rest] : [quote]
      })()
    : [quote]
  const showRibbon = settings.data?.show_category_ribbon !== false
  const showFeatured = settings.data?.show_featured_section !== false
  const featuredEyebrow =
    settings.data?.featured_section_eyebrow?.trim() || 'Unique products only in UGH'
  const featuredTitle =
    settings.data?.featured_section_title?.trim() || 'Explore a great range of products'

  return (
    <>
      {/* 1) Dark cinematic particle hero */}
      <CinematicHero
        siteName={settings.data?.site_name ?? 'UGH Appliances'}
        tagline={tagline}
        support={support}
      />

      {/* 2) Kitchen Line–style photo world begins after hero */}
      <KitchenLineCarousel slides={STORY_SLIDES} />

      <KitchenLineStory slides={STORY_SLIDES} />

      <section className="kl-pillars">
        <article>
          <p className="u-eyebrow" style={{ color: 'var(--ugh-ember)' }}>
            Kingdom
          </p>
          <h3>Your kitchen, your kingdom</h3>
          <p>
            A calm kitchen makes you happy. Our team brings the know-how to shape beautiful
            kitchens around your taste.
          </p>
        </article>
        <article>
          <p className="u-eyebrow" style={{ color: 'var(--ugh-ember)' }}>
            Space
          </p>
          <h3>Use every single space</h3>
          <p>
            With decades of kitchen craft and a wide range of accessories, we help you organise
            every corner.
          </p>
        </article>
        <article>
          <p className="u-eyebrow" style={{ color: 'var(--ugh-ember)' }}>
            Appliances
          </p>
          <h3>High-end appliances you will love</h3>
          <p>
            Long life, multi-functionality, and beautiful design — catalogue first, enquire when
            ready.
          </p>
        </article>
      </section>

      <section className="kl-fixed-quote" aria-label="Design statement">
        <div className="kl-fixed-quote__sticky">
          <div
            className="kl-fixed-quote__bg"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=2400&q=80')",
            }}
          />
          <div className="kl-fixed-quote__wash" />
          <h2 className="kl-fixed-quote__title">
            {quoteLines.map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </h2>
        </div>
      </section>

      {showRibbon ? (
        <section className="home-section home-section--dark" id="catalogue-start">
          <Reveal className="u-container">
            <p className="u-eyebrow">Shop by category</p>
            <h2 className="home-section__title">Every piece has a place</h2>
          </Reveal>
          {categories.isLoading ? (
            <div className="u-container">
              <StatusMessage title="Loading categories…" />
            </div>
          ) : categories.isError ? (
            <div className="u-container">
              <StatusMessage tone="error" title="Could not load categories" />
            </div>
          ) : (
            <Reveal staggerChildren=".category-ribbon__item" y={36}>
              <div className="category-ribbon">
                {(categories.data ?? []).map((category, index) => (
                  <Link
                    key={category.id}
                    to={`/catalogue/${category.slug}`}
                    className="category-ribbon__item"
                    style={{
                      backgroundImage: category.hero_image
                        ? `linear-gradient(rgba(10,9,8,0.45), rgba(10,9,8,0.72)), url(${category.hero_image})`
                        : categoryAccents[index % categoryAccents.length],
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <span className="category-ribbon__sheen" aria-hidden="true" />
                    <span className="category-ribbon__name">{category.name}</span>
                    <span className="category-ribbon__cta">Explore</span>
                  </Link>
                ))}
              </div>
            </Reveal>
          )}
        </section>
      ) : null}

      {showFeatured ? (
        <section className="home-section home-section--mist">
          <div className="u-container">
            <Reveal>
              <p className="u-eyebrow">{featuredEyebrow}</p>
              <h2 className="home-section__title home-section__title--dark">{featuredTitle}</h2>
            </Reveal>
            {featured.isLoading ? (
              <StatusMessage title="Loading featured products…" />
            ) : featured.isError ? (
              <StatusMessage tone="error" title="Could not load products" />
            ) : (featured.data?.results.length ?? 0) === 0 ? (
              <StatusMessage
                title="No featured products yet"
                detail="Mark products as featured in admin."
              />
            ) : (
              <Reveal staggerChildren=".product-card" y={32}>
                <div className="product-grid product-grid--mist">
                  {featured.data!.results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </section>
      ) : null}
    </>
  )
}
