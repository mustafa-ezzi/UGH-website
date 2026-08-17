import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useProduct, useProducts } from '../api/hooks'
import { EnquiryForm } from '../components/EnquiryForm'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { StatusMessage } from '../components/StatusMessage'
import { HOUSE_BRAND, HOUSE_BRAND_SHORT } from '../lib/brand'
import { formatPrice } from '../lib/format'
import { useEffect, useMemo, useState } from 'react'

export function ProductPage() {
  const { slug } = useParams()
  const productQuery = useProduct(slug)
  const product = productQuery.data
  const [activeImage, setActiveImage] = useState(0)
  const reduce = useReducedMotion()

  const relatedCategory = product?.categories[0]?.slug
  const related = useProducts({
    category: relatedCategory,
  })

  useEffect(() => {
    setActiveImage(0)
  }, [slug])

  const gallery = useMemo(() => {
    if (!product) return []
    if (product.images && product.images.length > 0) {
      return product.images.map((img) => ({
        url: img.image,
        alt: img.alt_text || product.name,
      }))
    }
    if (product.primary_image) {
      return [{ url: product.primary_image.url, alt: product.primary_image.alt_text || product.name }]
    }
    return []
  }, [product])

  const relatedItems =
    related.data?.results.filter((item) => item.slug !== product?.slug).slice(0, 4) ?? []

  if (productQuery.isLoading) {
    return (
      <section className="page-shell page-shell--mist">
        <div className="u-container">
          <StatusMessage title="Loading product…" />
        </div>
      </section>
    )
  }

  if (productQuery.isError || !product) {
    return (
      <section className="page-shell page-shell--mist">
        <div className="u-container">
          <StatusMessage
            tone="error"
            title="Product not found"
            detail="It may be unpublished or the link is incorrect."
          />
          <Link to="/catalogue" className="btn-ember" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
            Back to catalogue
          </Link>
        </div>
      </section>
    )
  }

  const specs = Object.entries(product.specs ?? {})

  return (
    <section className="page-shell page-shell--mist">
      <div className="u-container product-detail">
        <nav className="product-detail__crumbs" aria-label="Breadcrumb">
          <Link to="/catalogue">Catalogue</Link>
          {product.categories[0] ? (
            <>
              <span aria-hidden="true">/</span>
              <Link to={`/catalogue/${product.categories[0].slug}`}>
                {product.categories[0].name}
              </Link>
            </>
          ) : null}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-detail__grid">
          <div className="product-detail__gallery">
            <div className="product-detail__stage" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {gallery[activeImage] ? (
                  <motion.img
                    key={gallery[activeImage].url}
                    src={gallery[activeImage].url}
                    alt={gallery[activeImage].alt}
                    className="product-detail__stage-img"
                    initial={reduce ? false : { opacity: 0.2, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : (
                  <motion.div
                    key="placeholder"
                    className="product-card__placeholder product-card__placeholder--large"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                  >
                    <span>{HOUSE_BRAND_SHORT}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {gallery.length > 1 ? (
              <div className="product-detail__thumbs" role="listbox" aria-label="Product images">
                {gallery.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeImage}
                    className={index === activeImage ? 'is-active' : undefined}
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show image ${index + 1} of ${gallery.length}`}
                  >
                    <img src={image.url} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Reveal className="product-detail__info">
            <p className="u-eyebrow">{HOUSE_BRAND}</p>
            <h1 className="page-title page-title--dark">{product.name}</h1>
            <p className="product-detail__price">
              {formatPrice(product.price, product.currency)}
            </p>
            {product.sku ? <p className="product-detail__sku">SKU {product.sku}</p> : null}
            <p className="page-lede page-lede--dark">{product.short_description}</p>
            {product.long_description ? (
              <p className="product-detail__long">{product.long_description}</p>
            ) : null}

            {specs.length > 0 ? (
              <div className="product-detail__specs">
                <h2>Specifications</h2>
                <dl>
                  {specs.map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replace(/_/g, ' ')}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </Reveal>
        </div>

        <Reveal delay={0.1} className="product-detail__enquire">
          <EnquiryForm
            productSlug={product.slug}
            productName={product.name}
            productSku={product.sku || undefined}
          />
        </Reveal>

        {relatedItems.length > 0 ? (
          <div className="product-detail__related">
            <Reveal>
              <p className="u-eyebrow">Related</p>
              <h2 className="home-section__title home-section__title--dark">You may also like</h2>
            </Reveal>
            <Reveal staggerChildren=".product-card" y={28}>
              <div className="product-grid product-grid--mist">
                {relatedItems.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </Reveal>
          </div>
        ) : null}
      </div>
    </section>
  )
}
