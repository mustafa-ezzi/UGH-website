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
  uploadProductImage,
  type ManageProduct,
} from '../api'

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
    } else if (brands.data?.[0] && isNew && form.brand === 0) {
      setForm((f) => ({ ...f, brand: brands.data![0].id }))
    }
  }, [product.data, brands.data, isNew, form.brand])

  const save = useMutation({
    mutationFn: async () => {
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
      <header className="manage-page__header">
        <div>
          <p className="manage-brand__eyebrow">Product</p>
          <h2>{isNew ? 'New product' : form.name || 'Edit product'}</h2>
        </div>
        <Link to="/manage/products" className="manage-btn manage-btn--ghost">
          Back to list
        </Link>
      </header>

      {product.isLoading && !isNew ? <p className="manage-muted">Loading…</p> : null}
      {error ? <p className="manage-alert">{error}</p> : null}
      {message ? <p className="manage-success">{message}</p> : null}

      <form className="manage-form" onSubmit={onSubmit}>
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
        </div>

        <label className="manage-field">
          <span>Categories</span>
          <select
            multiple
            value={form.category_ids.map(String)}
            onChange={(e) =>
              setForm({
                ...form,
                category_ids: Array.from(e.target.selectedOptions).map((o) => Number(o.value)),
              })
            }
            size={Math.min(6, Math.max(3, categories.data?.length ?? 3))}
          >
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

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

        <div className="manage-checks">
          <label>
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Published
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
        <section className="manage-images">
          <h3>Images</h3>
          <div className="manage-images__grid">
            {product.data.images.map((img) => (
              <figure key={img.id}>
                {img.image_url ? <img src={img.image_url} alt={img.alt_text} /> : null}
                <button type="button" className="manage-btn manage-btn--ghost" onClick={() => onDeleteImage(img.id)}>
                  Remove
                </button>
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
      ) : null}
    </div>
  )
}
