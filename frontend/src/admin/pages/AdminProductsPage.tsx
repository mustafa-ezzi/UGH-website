import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  bulkUpdateProducts,
  fetchManageBrands,
  fetchManageProducts,
  updateManageProduct,
} from '../api'
import { EmptyState, PageHeader } from '../components/PageHeader'

export function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'' | 'true' | 'false'>('')
  const [featured, setFeatured] = useState<'' | 'true' | 'false'>('')
  const [brand, setBrand] = useState<number | ''>('')
  const [selected, setSelected] = useState<number[]>([])
  const queryClient = useQueryClient()

  const brands = useQuery({ queryKey: ['manage-brands'], queryFn: fetchManageBrands })
  const products = useQuery({
    queryKey: ['manage-products', q, page, status, featured, brand],
    queryFn: () =>
      fetchManageProducts({
        search: q || undefined,
        page,
        is_published: status === '' ? '' : status === 'true',
        is_featured: featured === '' ? '' : featured === 'true',
        brand,
      }),
  })

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil((products.data?.count ?? 0) / 24)),
    [products.data?.count],
  )

  const toggle = useMutation({
    mutationFn: ({
      id,
      field,
      value,
    }: {
      id: number
      field: 'is_published' | 'is_featured'
      value: boolean
    }) => updateManageProduct(id, { [field]: value }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manage-products'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
    },
  })

  const bulk = useMutation({
    mutationFn: (flags: { is_published?: boolean; is_featured?: boolean }) =>
      bulkUpdateProducts(selected, flags),
    onSuccess: () => {
      setSelected([])
      void queryClient.invalidateQueries({ queryKey: ['manage-products'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
    },
  })

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    setQ(search.trim())
  }

  function toggleSelect(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleAll() {
    const ids = products.data?.results.map((p) => p.id) ?? []
    if (ids.every((id) => selected.includes(id))) setSelected([])
    else setSelected(ids)
  }

  return (
    <div className="manage-page">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Publish, feature, and edit pricing — clients can do this without developer help."
        actions={
          <Link to="/manage/products/new" className="manage-btn manage-btn--primary">
            Add product
          </Link>
        }
      />

      <form className="manage-toolbar manage-toolbar--wrap" onSubmit={onSearch}>
        <input
          placeholder="Search name, SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value as '' | 'true' | 'false')
          }}
        >
          <option value="">All status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        <select
          value={featured}
          onChange={(e) => {
            setPage(1)
            setFeatured(e.target.value as '' | 'true' | 'false')
          }}
        >
          <option value="">Featured: any</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
        <select
          value={brand}
          onChange={(e) => {
            setPage(1)
            setBrand(e.target.value ? Number(e.target.value) : '')
          }}
        >
          <option value="">All brands</option>
          {(brands.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button type="submit" className="manage-btn">
          Search
        </button>
      </form>

      {selected.length > 0 ? (
        <div className="manage-bulkbar">
          <span>{selected.length} selected</span>
          <button
            type="button"
            className="manage-btn"
            onClick={() => bulk.mutate({ is_published: true })}
          >
            Publish
          </button>
          <button
            type="button"
            className="manage-btn"
            onClick={() => bulk.mutate({ is_published: false })}
          >
            Unpublish
          </button>
          <button
            type="button"
            className="manage-btn"
            onClick={() => bulk.mutate({ is_featured: true })}
          >
            Feature
          </button>
          <button
            type="button"
            className="manage-btn"
            onClick={() => bulk.mutate({ is_featured: false })}
          >
            Unfeature
          </button>
          <button type="button" className="manage-btn manage-btn--ghost" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      ) : null}

      {products.isLoading ? <p className="manage-muted">Loading products…</p> : null}
      {products.isError ? (
        <p className="manage-alert">{(products.error as Error).message}</p>
      ) : null}

      {products.data && products.data.results.length === 0 ? (
        <EmptyState title="No products match" detail="Try clearing filters or add a new product." />
      ) : null}

      {products.data && products.data.results.length > 0 ? (
        <>
          <div className="manage-table-wrap">
            <table className="manage-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        products.data.results.length > 0 &&
                        products.data.results.every((p) => selected.includes(p.id))
                      }
                      onChange={toggleAll}
                      aria-label="Select all on page"
                    />
                  </th>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Live</th>
                  <th>Featured</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.data.results.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        aria-label={`Select ${p.name}`}
                      />
                    </td>
                    <td>
                      <div className="manage-product-cell">
                        {p.primary_image ? (
                          <img src={p.primary_image} alt="" />
                        ) : (
                          <span className="manage-thumb-fallback" />
                        )}
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.sku || p.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td>{p.brand_name}</td>
                    <td>
                      {p.currency} {p.price}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={p.is_published ? 'manage-pill is-on' : 'manage-pill'}
                        onClick={() =>
                          toggle.mutate({
                            id: p.id,
                            field: 'is_published',
                            value: !p.is_published,
                          })
                        }
                      >
                        {p.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={p.is_featured ? 'manage-pill is-on' : 'manage-pill'}
                        onClick={() =>
                          toggle.mutate({
                            id: p.id,
                            field: 'is_featured',
                            value: !p.is_featured,
                          })
                        }
                      >
                        {p.is_featured ? 'Featured' : '—'}
                      </button>
                    </td>
                    <td>
                      <Link to={`/manage/products/${p.id}`} className="manage-link">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="manage-pager">
            <button
              type="button"
              className="manage-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {page} / {pageCount} · {products.data.count} products
            </span>
            <button
              type="button"
              className="manage-btn"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
