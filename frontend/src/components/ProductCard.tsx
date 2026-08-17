import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { Product } from '../api/types'
import { fetchProduct } from '../api/client'
import { HOUSE_BRAND, HOUSE_BRAND_SHORT } from '../lib/brand'
import { formatPrice } from '../lib/format'

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.primary_image
  const queryClient = useQueryClient()

  function prefetch() {
    void queryClient.prefetchQuery({
      queryKey: ['product', product.slug],
      queryFn: () => fetchProduct(product.slug),
      staleTime: 60_000,
    })
  }

  return (
    <article className="product-card">
      <Link
        to={`/product/${product.slug}`}
        className="product-card__link"
        onMouseEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
      >
        <div className="product-card__media">
          <span className="product-card__sheen" aria-hidden="true" />
          {image ? (
            <img src={image.url} alt={image.alt_text || product.name} loading="lazy" />
          ) : (
            <div className="product-card__placeholder" aria-hidden="true">
              <span>{HOUSE_BRAND_SHORT}</span>
            </div>
          )}
        </div>
        <div className="product-card__body">
          <p className="product-card__brand">{product.brand.name}</p>
          <p className="product-card__house">A product of {HOUSE_BRAND}</p>
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__price">{formatPrice(product.price, product.currency)}</p>
          <span className="product-card__view">View</span>
        </div>
      </Link>
    </article>
  )
}
