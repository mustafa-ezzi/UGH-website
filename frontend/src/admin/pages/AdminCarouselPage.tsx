import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import {
  createManageCarouselSlide,
  deleteManageCarouselSlide,
  fetchManageCarouselSlides,
  updateManageCarouselSlide,
  type ManageCarouselSlide,
} from '../api'
import { EmptyState, PageHeader } from '../components/PageHeader'

const blank = {
  eyebrow: 'Just newly arrived',
  title: '',
  body: '',
  cta: 'Discover more',
  href: '/catalogue',
  sort_order: 0,
  is_active: true,
}

export function AdminCarouselPage() {
  const queryClient = useQueryClient()
  const slides = useQuery({
    queryKey: ['manage-carousel-slides'],
    queryFn: fetchManageCarouselSlides,
  })
  const [editing, setEditing] = useState<Partial<ManageCarouselSlide> | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const save = useMutation({
    mutationFn: async () => {
      if (!editing?.title?.trim()) throw new Error('Title is required')
      const payload = {
        title: editing.title.trim(),
        eyebrow: editing.eyebrow ?? '',
        body: editing.body ?? '',
        cta: editing.cta ?? 'Discover more',
        href: editing.href?.trim() || '/catalogue',
        sort_order: editing.sort_order ?? 0,
        is_active: editing.is_active ?? true,
      }
      if (editing.id) {
        return updateManageCarouselSlide(editing.id, payload, imageFile)
      }
      if (!imageFile) throw new Error('Choose a slide image')
      return createManageCarouselSlide(payload, imageFile)
    },
    onSuccess: () => {
      setEditing(null)
      setImageFile(null)
      setPreview('')
      if (fileRef.current) fileRef.current.value = ''
      void queryClient.invalidateQueries({ queryKey: ['manage-carousel-slides'] })
      void queryClient.invalidateQueries({ queryKey: ['carousel-slides'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteManageCarouselSlide(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manage-carousel-slides'] })
      void queryClient.invalidateQueries({ queryKey: ['carousel-slides'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const toggle = useMutation({
    mutationFn: (slide: ManageCarouselSlide) =>
      updateManageCarouselSlide(slide.id, {
        title: slide.title,
        eyebrow: slide.eyebrow,
        body: slide.body,
        cta: slide.cta,
        href: slide.href,
        sort_order: slide.sort_order,
        is_active: !slide.is_active,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manage-carousel-slides'] })
      void queryClient.invalidateQueries({ queryKey: ['carousel-slides'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  async function moveSlide(slide: ManageCarouselSlide, dir: -1 | 1) {
    const sorted = [...(slides.data ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((s) => s.id === slide.id)
    const swap = sorted[idx + dir]
    if (!swap) return
    setError('')
    try {
      await Promise.all([
        updateManageCarouselSlide(slide.id, {
          title: slide.title,
          eyebrow: slide.eyebrow,
          body: slide.body,
          cta: slide.cta,
          href: slide.href,
          sort_order: swap.sort_order,
          is_active: slide.is_active,
        }),
        updateManageCarouselSlide(swap.id, {
          title: swap.title,
          eyebrow: swap.eyebrow,
          body: swap.body,
          cta: swap.cta,
          href: swap.href,
          sort_order: slide.sort_order,
          is_active: swap.is_active,
        }),
      ])
      void queryClient.invalidateQueries({ queryKey: ['manage-carousel-slides'] })
      void queryClient.invalidateQueries({ queryKey: ['carousel-slides'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reorder')
    }
  }

  function startNew() {
    setError('')
    setImageFile(null)
    setPreview('')
    if (fileRef.current) fileRef.current.value = ''
    setEditing({
      ...blank,
      sort_order: slides.data?.length ?? 0,
    })
  }

  function startEdit(slide: ManageCarouselSlide) {
    setError('')
    setImageFile(null)
    setPreview(slide.image_url ?? '')
    if (fileRef.current) fileRef.current.value = ''
    setEditing(slide)
  }

  function onPickImage(file: File | null) {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    if (!file) {
      setImageFile(null)
      setPreview(editing?.image_url ?? '')
      return
    }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    save.mutate()
  }

  const sorted = [...(slides.data ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="manage-page">
      <PageHeader
        eyebrow="Homepage"
        title="Carousel"
        description="Photos and copy for the storefront carousel (and the matching story panels below it)."
        actions={
          <button type="button" className="manage-btn manage-btn--primary" onClick={startNew}>
            Add slide
          </button>
        }
      />

      {error ? <p className="manage-alert">{error}</p> : null}

      {editing ? (
        <form className="manage-form manage-inline-form" onSubmit={onSubmit}>
          <h3>{editing.id ? 'Edit slide' : 'New slide'}</h3>
          {preview ? (
            <img className="manage-slide-preview" src={preview} alt="" />
          ) : (
            <div className="manage-slide-preview manage-slide-preview--empty">No image yet</div>
          )}
          <label className="manage-field">
            <span>{editing.id ? 'Replace image' : 'Slide image'}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              required={!editing.id}
            />
          </label>
          <div className="manage-form__row">
            <label className="manage-field">
              <span>Eyebrow</span>
              <input
                value={editing.eyebrow ?? ''}
                onChange={(e) => setEditing({ ...editing, eyebrow: e.target.value })}
              />
            </label>
            <label className="manage-field">
              <span>Button label</span>
              <input
                value={editing.cta ?? ''}
                onChange={(e) => setEditing({ ...editing, cta: e.target.value })}
              />
            </label>
          </div>
          <label className="manage-field">
            <span>Title</span>
            <input
              value={editing.title ?? ''}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              required
            />
          </label>
          <label className="manage-field">
            <span>Body</span>
            <textarea
              rows={3}
              value={editing.body ?? ''}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            />
          </label>
          <div className="manage-form__row">
            <label className="manage-field">
              <span>Link (storefront path)</span>
              <input
                value={editing.href ?? ''}
                onChange={(e) => setEditing({ ...editing, href: e.target.value })}
                placeholder="/catalogue/ovens"
              />
            </label>
            <label className="manage-field">
              <span>Sort order</span>
              <input
                type="number"
                value={editing.sort_order ?? 0}
                onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="manage-checks">
            <input
              type="checkbox"
              checked={editing.is_active ?? true}
              onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
            />
            Show on storefront
          </label>
          <div className="manage-form__actions">
            <button type="submit" className="manage-btn manage-btn--primary" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save slide'}
            </button>
            <button
              type="button"
              className="manage-btn manage-btn--ghost"
              onClick={() => {
                if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
                setEditing(null)
                setImageFile(null)
                setPreview('')
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {slides.isLoading ? <p className="manage-muted">Loading…</p> : null}
      {slides.data && slides.data.length === 0 ? (
        <EmptyState
          title="No carousel slides yet"
          detail="Add a photo and headline. Until then, the homepage keeps the default sample photos. Once you save a slide, those samples are replaced."
        />
      ) : null}

      {sorted.length > 0 ? (
        <div className="manage-table-wrap">
          <table className="manage-table">
            <thead>
              <tr>
                <th>Slide</th>
                <th>Link</th>
                <th>Order</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((slide, index) => (
                <tr key={slide.id}>
                  <td>
                    <div className="manage-product-cell">
                      {slide.image_url ? (
                        <img src={slide.image_url} alt="" />
                      ) : (
                        <span className="manage-thumb-fallback" />
                      )}
                      <div>
                        <strong>{slide.title}</strong>
                        <small>{slide.eyebrow || '—'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{slide.href || '—'}</td>
                  <td>
                    <div className="manage-images__tools">
                      <button
                        type="button"
                        className="manage-btn manage-btn--ghost"
                        disabled={index === 0}
                        onClick={() => void moveSlide(slide, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="manage-btn manage-btn--ghost"
                        disabled={index === sorted.length - 1}
                        onClick={() => void moveSlide(slide, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={slide.is_active ? 'manage-pill is-on' : 'manage-pill'}
                      onClick={() => toggle.mutate(slide)}
                    >
                      {slide.is_active ? 'Live' : 'Hidden'}
                    </button>
                  </td>
                  <td className="manage-table__actions">
                    <button type="button" className="manage-link" onClick={() => startEdit(slide)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="manage-link manage-link--danger"
                      onClick={() => {
                        if (confirm(`Delete “${slide.title}”?`)) remove.mutate(slide.id)
                      }}
                    >
                      Delete
                    </button>
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
