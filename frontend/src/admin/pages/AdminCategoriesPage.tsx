import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import {
  createManageCategory,
  deleteManageCategory,
  fetchManageCategories,
  updateManageCategory,
  type ManageCategory,
} from '../api'
import { EmptyState, PageHeader } from '../components/PageHeader'

const blank = {
  name: '',
  description: '',
  parent: null as number | null,
  sort_order: 0,
  is_active: true,
}

export function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const categories = useQuery({ queryKey: ['manage-categories'], queryFn: fetchManageCategories })
  const [editing, setEditing] = useState<Partial<ManageCategory> | null>(null)
  const [error, setError] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      if (!editing?.name?.trim()) throw new Error('Name is required')
      const payload = {
        name: editing.name,
        description: editing.description ?? '',
        parent: editing.parent ?? null,
        sort_order: editing.sort_order ?? 0,
        is_active: editing.is_active ?? true,
      }
      if (editing.id) return updateManageCategory(editing.id, payload)
      return createManageCategory(payload)
    },
    onSuccess: () => {
      setEditing(null)
      void queryClient.invalidateQueries({ queryKey: ['manage-categories'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteManageCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manage-categories'] })
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
        title="Categories"
        description="Powers the mega-menu, category pages, and homepage ribbon."
        actions={
          <button
            type="button"
            className="manage-btn manage-btn--primary"
            onClick={() => setEditing({ ...blank })}
          >
            Add category
          </button>
        }
      />

      {error ? <p className="manage-alert">{error}</p> : null}

      {editing ? (
        <form className="manage-form manage-inline-form" onSubmit={onSubmit}>
          <h3>{editing.id ? 'Edit category' : 'New category'}</h3>
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
              <span>Parent</span>
              <select
                value={editing.parent ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    parent: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">None (top level)</option>
                {(categories.data ?? [])
                  .filter((c) => c.id !== editing.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
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

      {categories.isLoading ? <p className="manage-muted">Loading…</p> : null}
      {categories.data && categories.data.length === 0 ? (
        <EmptyState title="No categories yet" detail="Add stoves, chimneys, ovens, basins…" />
      ) : null}

      {categories.data && categories.data.length > 0 ? (
        <div className="manage-table-wrap">
          <table className="manage-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Parent</th>
                <th>Order</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.data.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <strong>{cat.name}</strong>
                    <small className="manage-table__sub">{cat.slug}</small>
                  </td>
                  <td>{cat.parent_name ?? '—'}</td>
                  <td>{cat.sort_order}</td>
                  <td>
                    <span className={cat.is_active ? 'manage-pill is-on' : 'manage-pill'}>
                      {cat.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="manage-table__actions">
                    <button type="button" className="manage-link" onClick={() => setEditing(cat)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="manage-link manage-link--danger"
                      onClick={() => {
                        if (confirm(`Delete “${cat.name}”?`)) remove.mutate(cat.id)
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
