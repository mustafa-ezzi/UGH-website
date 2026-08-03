import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchManageProducts, updateManageProduct } from '../api'

export function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const queryClient = useQueryClient()

  const products = useQuery({
    queryKey: ['manage-products', q],
    queryFn: () => fetchManageProducts({ search: q || undefined }),
  })

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

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setQ(search.trim())
  }

  return (
    <div className="manage-page">
      <header className="manage-page__header">
        <div>
          <p className="manage-brand__eyebrow">Catalogue</p>
          <h2>Products</h2>
        </div>
        <Link to="/manage/products/new" className="manage-btn manage-btn--primary">
          Add product
        </Link>
      </header>

      <form className="manage-toolbar" onSubmit={onSearch}>
        <input
          placeholder="Search name, SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="manage-btn">
          Search
        </button>
      </form>

      {products.isLoading ? <p className="manage-muted">Loading products…</p> : null}
      {products.isError ? (
        <p className="manage-alert">{(products.error as Error).message}</p>
      ) : null}

      {products.data ? (
        <div className="manage-table-wrap">
          <table className="manage-table">
            <thead>
              <tr>
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
      ) : null}
    </div>
  )
}
