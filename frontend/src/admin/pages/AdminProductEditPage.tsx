import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createManageProduct,
  deleteManageProduct,
  deleteProductImage,
  fetchManageBrands,
  fetchManageCategories,
  fetchManageProduct,
  updateManageProduct,
  updateProductImage,
  uploadProductImage,
  type ManageProduct,
} from '../api'
import { PageHeader } from '../components/PageHeader'

const emptyForm = {
  name: '',
  brand: 0,
  category_ids: [] as number[],
  sku: '',
  price: '0.00',
  currency: 'PKR',
  short_description: '',
  long_description: '',
  is_featured: false,
  is_published: true,
  sort_order: 0,
}

type SpecRow = { key: string; value: string }

export function AdminProductEditPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const productId = isNew ? null : Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const brands = useQuery({ queryKey: ['manage-brands'], queryFn: fetchManageBrands })
  const categories = useQuery({
    queryKey: ['manage-categories'],
    queryFn: fetchManageCategories,
  })
  const product = useQuery({
    queryKey: ['manage-product', productId],
    queryFn: () => fetchManageProduct(productId!),
    enabled: productId != null && !Number.isNaN(productId),
  })

  const [form, setForm] = useState(emptyForm)
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: '', value: '' }])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (product.data) {
      setForm({
        name: product.data.name,
        brand: product.data.brand,
        category_ids: product.data.category_ids ?? [],
        sku: product.data.sku,
        price: product.data.price,
        currency: product.data.currency,
        short_description: product.data.short_description,
        long_description: product.data.long_description,
        is_featured: product.data.is_featured,
        is_published: product.data.is_published,
        sort_order: product.data.sort_order,
      })
      const entries = Object.entries(product.data.specs ?? {})
      setSpecs(entries.length ? entries.map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }])
    } else if (brands.data?.[0] && isNew && form.brand === 0) {
      setForm((f) => ({ ...f, brand: brands.data![0].id }))
    }
  }, [product.data, brands.data, isNew, form.brand])

  const save = useMutation({
    mutationFn: async () => {
      const specObj: Record<string, string> = {}
      for (const row of specs) {
        if (row.key.trim()) specObj[row.key.trim()] = row.value
      }
      const payload: Partial<ManageProduct> = {
        name: form.name,
        brand: form.brand,
        category_ids: form.category_ids,
        sku: form.sku,
        price: form.price,
        currency: form.currency,
        short_description: form.short_description,
        long_description: form.long_description,
        is_featured: form.is_featured,
        is_published: form.is_published,
        sort_order: form.sort_order,
        specs: specObj,
      }
      if (isNew) return createManageProduct(payload)
      return updateManageProduct(productId!, payload)
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['manage-products'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
      setMessage('Saved.')
      if (isNew) navigate(`/manage/products/${data.id}`, { replace: true })
      else void queryClient.invalidateQueries({ queryKey: ['manage-product', data.id] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const remove = useMutation({
    mutationFn: () => deleteManageProduct(productId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manage-products'] })
      navigate('/manage/products')
    },
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    save.mutate()
  }

  async function onUpload(file: File | null) {
    if (!file || !productId) return
    setError('')
    try {
      await uploadProductImage(productId, file)
      void queryClient.invalidateQueries({ queryKey: ['manage-product', productId] })
      setMessage('Image uploaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function moveImage(imageId: number, dir: -1 | 1) {
    if (!product.data) return
    const sorted = [...product.data.images].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((img) => img.id === imageId)
    const swap = sorted[idx + dir]
    if (!swap) return
    try {
      await Promise.all([
        updateProductImage(sorted[idx].id, { sort_order: swap.sort_order }),
        updateProductImage(swap.id, { sort_order: sorted[idx].sort_order }),
      ])
      void queryClient.invalidateQueries({ queryKey: ['manage-product', productId] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reorder')
    }
  }

  async function onDeleteImage(imageId: number) {
    try {
      await deleteProductImage(imageId)
      void queryClient.invalidateQueries({ queryKey: ['manage-product', productId] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete image')
    }
  }

  return (
    <div className="manage-page">
      <PageHeader
        eyebrow="Product"
        title={isNew ? 'New product' : form.name || 'Edit product'}
        description="Prices, copy, images, and visibility — all editable here."
        actions={
          <Link to="/manage/products" className="manage-btn manage-btn--ghost">
            Back to list
          </Link>
        }
      />

      {product.isLoading && !isNew ? <p className="manage-muted">Loading…</p> : null}
      {error ? <p className="manage-alert">{error}</p> : null}
      {message ? <p className="manage-success">{message}</p> : null}

      <form className="manage-form manage-form--wide" onSubmit={onSubmit}>
        <section className="manage-form-section">
          <h3>Basics</h3>
          <label className="manage-field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <div className="manage-form__row">
            <label className="manage-field">
              <span>Brand</span>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: Number(e.target.value) })}
                required
              >
                {(brands.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="manage-field">
              <span>SKU</span>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </label>
          </div>
          <div className="manage-form__row">
            <label className="manage-field">
              <span>Price</span>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </label>
            <label className="manage-field">
              <span>Currency</span>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {['PKR', 'USD', 'AED', 'EUR'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="manage-field">
              <span>Sort order</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="manage-field">
            <span>Categories</span>
            <div className="manage-chip-grid">
              {(categories.data ?? []).map((c) => {
                const on = form.category_ids.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={on ? 'manage-chip is-on' : 'manage-chip'}
                    onClick={() =>
                      setForm({
                        ...form,
                        category_ids: on
                          ? form.category_ids.filter((id) => id !== c.id)
                          : [...form.category_ids, c.id],
                      })
                    }
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </label>
        </section>

        <section className="manage-form-section">
          <h3>Copy</h3>
          <label className="manage-field">
            <span>Short description</span>
            <input
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
            />
          </label>
          <label className="manage-field">
            <span>Long description</span>
            <textarea
              rows={6}
              value={form.long_description}
              onChange={(e) => setForm({ ...form, long_description: e.target.value })}
            />
          </label>
        </section>

        <section className="manage-form-section">
          <h3>Specs</h3>
          <div className="manage-specs">
            {specs.map((row, index) => (
              <div key={index} className="manage-specs__row">
                <input
                  placeholder="Label (e.g. Burners)"
                  value={row.key}
                  onChange={(e) => {
                    const next = [...specs]
                    next[index] = { ...row, key: e.target.value }
                    setSpecs(next)
                  }}
                />
                <input
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...specs]
                    next[index] = { ...row, value: e.target.value }
                    setSpecs(next)
                  }}
                />
                <button
                  type="button"
                  className="manage-btn manage-btn--ghost"
                  onClick={() => setSpecs(specs.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="manage-btn"
              onClick={() => setSpecs([...specs, { key: '', value: '' }])}
            >
              Add spec
            </button>
          </div>
        </section>

        <section className="manage-form-section">
          <h3>Visibility</h3>
          <div className="manage-checks">
            <label>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              Published on storefront
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Featured on homepage
            </label>
          </div>
        </section>

        <div className="manage-form__actions">
          <button type="submit" className="manage-btn manage-btn--primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save product'}
          </button>
          {!isNew ? (
            <button
              type="button"
              className="manage-btn manage-btn--danger"
              onClick={() => {
                if (confirm('Delete this product?')) remove.mutate()
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      </form>

      {!isNew && product.data ? (
        <section className="manage-images manage-form-section">
          <h3>Images</h3>
          <p className="manage-muted">Reorder with arrows. First image is the catalogue thumbnail.</p>
          <div className="manage-images__grid">
            {[...product.data.images]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((img, index, arr) => (
                <figure key={img.id}>
                  {img.image_url ? <img src={img.image_url} alt={img.alt_text} /> : null}
                  <div className="manage-images__tools">
                    <button
                      type="button"
                      className="manage-btn manage-btn--ghost"
                      disabled={index === 0}
                      onClick={() => void moveImage(img.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="manage-btn manage-btn--ghost"
                      disabled={index === arr.length - 1}
                      onClick={() => void moveImage(img.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="manage-btn manage-btn--ghost"
                      onClick={() => void onDeleteImage(img.id)}
                    >
                      Remove
                    </button>
                  </div>
                </figure>
              ))}
          </div>
          <label className="manage-field">
            <span>Upload image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </section>
      ) : (
        <p className="manage-muted">Save the product first to upload images.</p>
      )}
    </div>
  )
}
