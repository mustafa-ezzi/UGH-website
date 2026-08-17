import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useCategories, useProducts } from '../api/hooks'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { StatusMessage } from '../components/StatusMessage'

export function CataloguePage() {
  const { categorySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')

  const brand = searchParams.get('brand') ?? undefined
  const search = searchParams.get('search') ?? undefined
  const ordering = searchParams.get('ordering') ?? undefined

  const categories = useCategories()
  const products = useProducts({
    category: categorySlug,
    brand,
    search,
    ordering,
  })

  const activeCategory = useMemo(
    () => categories.data?.find((c) => c.slug === categorySlug),
    [categories.data, categorySlug],
  )

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(key)
    else next.set(key, value)
    setSearchParams(next)
  }

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault()
    updateFilter('search', searchInput.trim())
  }

  return (
    <section className="page-shell page-shell--mist">
      <div className="u-container catalogue-layout">
        <aside className="catalogue-filters" aria-label="Filters">
          <p className="u-eyebrow">Filter</p>
          <h2 className="catalogue-filters__title">Refine</h2>

          <form className="catalogue-filters__search" onSubmit={onSearchSubmit}>
            <label>
              <span className="sr-only">Search</span>
              <input
                type="search"
                placeholder="Search appliances"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-ember btn-ember--compact">
              Search
            </button>
          </form>

          <div className="catalogue-filters__group">
            <p className="catalogue-filters__label">Category</p>
            <Link
              to="/catalogue"
              className={!categorySlug ? 'is-active' : undefined}
            >
              All
            </Link>
            {(categories.data ?? []).map((category) => (
              <Link
                key={category.id}
                to={`/catalogue/${category.slug}${searchParams.toString() ? `?${searchParams}` : ''}`}
                className={categorySlug === category.slug ? 'is-active' : undefined}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="catalogue-filters__group">
            <p className="catalogue-filters__label">Sort</p>
            <select
              value={ordering ?? ''}
              onChange={(e) => updateFilter('ordering', e.target.value)}
            >
              <option value="">Default</option>
              <option value="price">Price · low to high</option>
              <option value="-price">Price · high to low</option>
              <option value="name">Name · A–Z</option>
              <option value="-created_at">Newest</option>
            </select>
          </div>
        </aside>

        <div className="catalogue-main">
          <Reveal>
            <p className="u-eyebrow">Catalogue</p>
            <h1 className="page-title page-title--dark">
              {activeCategory?.name ?? 'All appliances'}
            </h1>
            <p className="page-lede page-lede--dark">
              {activeCategory?.description ||
            'Browse stoves, chimneys, ovens, sinks, and hardware from United Gas & Home Appliances. Prices for reference — enquire to purchase.'}
            </p>
          </Reveal>

          {products.isLoading ? (
            <StatusMessage title="Loading catalogue…" />
          ) : products.isError ? (
            <StatusMessage
              tone="error"
              title="Could not load products"
              detail={products.error instanceof Error ? products.error.message : undefined}
            />
          ) : (products.data?.results.length ?? 0) === 0 ? (
            <StatusMessage
              title="No products found"
              detail="Try another category or search term."
            />
          ) : (
            <>
              <p className="catalogue-count">
                {products.data!.count} piece{products.data!.count === 1 ? '' : 's'}
              </p>
              <Reveal staggerChildren=".product-card" y={30}>
                <div className="product-grid product-grid--mist">
                  {products.data!.results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Reveal>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
