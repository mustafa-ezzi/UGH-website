import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import {
  createManageBrand,
  deleteManageBrand,
  fetchManageBrands,
  updateManageBrand,
  type ManageBrand,
} from '../api'
import { EmptyState, PageHeader } from '../components/PageHeader'

const blank = { name: '', description: '', sort_order: 0, is_active: true }

export function AdminBrandsPage() {
  const queryClient = useQueryClient()
  const brands = useQuery({ queryKey: ['manage-brands'], queryFn: fetchManageBrands })
  const [editing, setEditing] = useState<Partial<ManageBrand> | null>(null)
  const [error, setError] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      if (!editing?.name?.trim()) throw new Error('Name is required')
      if (editing.id) {
        return updateManageBrand(editing.id, {
          name: editing.name,
          description: editing.description ?? '',
          sort_order: editing.sort_order ?? 0,
          is_active: editing.is_active ?? true,
        })
      }
      return createManageBrand({
        name: editing.name,
        description: editing.description ?? '',
        sort_order: editing.sort_order ?? 0,
        is_active: editing.is_active ?? true,
      })
    },
    onSuccess: () => {
      setEditing(null)
      void queryClient.invalidateQueries({ queryKey: ['manage-brands'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteManageBrand(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manage-brands'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    save.mutate()
  }

  return (
    <div className="manage-page">
      <PageHeader
        eyebrow="Taxonomy"
        title="Brands"
        description="Shown on product cards as “Brand — a product of United Gas & Home Appliances”."
        actions={
          <button
            type="button"
            className="manage-btn manage-btn--primary"
            onClick={() => setEditing({ ...blank })}
          >
            Add brand
          </button>
        }
      />

      {error ? <p className="manage-alert">{error}</p> : null}

      {editing ? (
        <form className="manage-form manage-inline-form" onSubmit={onSubmit}>
          <h3>{editing.id ? 'Edit brand' : 'New brand'}</h3>
          <div className="manage-form__row">
            <label className="manage-field">
              <span>Name</span>
              <input
                value={editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
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
          <label className="manage-field">
            <span>Description</span>
            <textarea
              rows={3}
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </label>
          <label className="manage-checks">
            <input
              type="checkbox"
              checked={editing.is_active ?? true}
              onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
            />
            Active
          </label>
          <div className="manage-form__actions">
            <button type="submit" className="manage-btn manage-btn--primary" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="manage-btn manage-btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {brands.isLoading ? <p className="manage-muted">Loading…</p> : null}
      {brands.data && brands.data.length === 0 ? (
        <EmptyState title="No brands yet" detail="Add Mac'sons, Bosch, or your house brands." />
      ) : null}

      {brands.data && brands.data.length > 0 ? (
        <div className="manage-card-grid">
          {brands.data.map((brand) => (
            <article key={brand.id} className="manage-card">
              <div className="manage-card__top">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt="" className="manage-card__thumb" />
                ) : (
                  <span className="manage-card__thumb manage-card__thumb--empty">{brand.name[0]}</span>
                )}
                <div>
                  <strong>{brand.name}</strong>
                  <small>{brand.is_active ? 'Active' : 'Hidden'} · order {brand.sort_order}</small>
                </div>
              </div>
              {brand.description ? <p className="manage-card__body">{brand.description}</p> : null}
              <div className="manage-card__actions">
                <button type="button" className="manage-btn" onClick={() => setEditing(brand)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="manage-btn manage-btn--danger"
                  onClick={() => {
                    if (confirm(`Delete brand “${brand.name}”? Products using it may block this.`)) {
                      remove.mutate(brand.id)
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
