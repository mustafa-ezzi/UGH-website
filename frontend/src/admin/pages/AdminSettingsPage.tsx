import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useEffect, useState } from 'react'
import { fetchManageSettings, updateManageSettings, type ManageSettings } from '../api'

export function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const settings = useQuery({ queryKey: ['manage-settings'], queryFn: fetchManageSettings })
  const [form, setForm] = useState<Partial<ManageSettings>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (settings.data) setForm(settings.data)
  }, [settings.data])

  const save = useMutation({
    mutationFn: () => updateManageSettings(form),
    onSuccess: (data) => {
      setForm(data)
      setMessage('Settings saved. Homepage will reflect these on next load.')
      void queryClient.invalidateQueries({ queryKey: ['manage-settings'] })
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    save.mutate()
  }

  if (settings.isLoading) return <p className="manage-muted">Loading settings…</p>

  return (
    <div className="manage-page">
      <header className="manage-page__header">
        <div>
          <p className="manage-brand__eyebrow">Content</p>
          <h2>Site settings</h2>
        </div>
      </header>

      {error ? <p className="manage-alert">{error}</p> : null}
      {message ? <p className="manage-success">{message}</p> : null}

      <form className="manage-form" onSubmit={onSubmit}>
        <label className="manage-field">
          <span>Site name</span>
          <input
            value={form.site_name ?? ''}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
          />
        </label>
        <label className="manage-field">
          <span>Tagline</span>
          <input
            value={form.tagline ?? ''}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
        </label>
        <label className="manage-field">
          <span>Hero supporting text</span>
          <input
            value={form.hero_supporting_text ?? ''}
            onChange={(e) => setForm({ ...form, hero_supporting_text: e.target.value })}
          />
        </label>
        <label className="manage-field">
          <span>Homepage quote</span>
          <input
            value={form.homepage_quote ?? ''}
            onChange={(e) => setForm({ ...form, homepage_quote: e.target.value })}
          />
        </label>
        <div className="manage-form__row">
          <label className="manage-field">
            <span>Featured eyebrow</span>
            <input
              value={form.featured_section_eyebrow ?? ''}
              onChange={(e) => setForm({ ...form, featured_section_eyebrow: e.target.value })}
            />
          </label>
          <label className="manage-field">
            <span>Featured title</span>
            <input
              value={form.featured_section_title ?? ''}
              onChange={(e) => setForm({ ...form, featured_section_title: e.target.value })}
            />
          </label>
        </div>
        <div className="manage-checks">
          <label>
            <input
              type="checkbox"
              checked={Boolean(form.show_featured_section)}
              onChange={(e) => setForm({ ...form, show_featured_section: e.target.checked })}
            />
            Show featured section
          </label>
          <label>
            <input
              type="checkbox"
              checked={Boolean(form.show_category_ribbon)}
              onChange={(e) => setForm({ ...form, show_category_ribbon: e.target.checked })}
            />
            Show category ribbon
          </label>
        </div>
        <label className="manage-field">
          <span>Contact email</span>
          <input
            value={form.contact_email ?? ''}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
          />
        </label>
        <label className="manage-field">
          <span>Notify enquiries to</span>
          <input
            value={form.notify_enquiries_to ?? ''}
            onChange={(e) => setForm({ ...form, notify_enquiries_to: e.target.value })}
          />
        </label>
        <label className="manage-field">
          <span>About</span>
          <textarea
            rows={5}
            value={form.about_blurb ?? ''}
            onChange={(e) => setForm({ ...form, about_blurb: e.target.value })}
          />
        </label>
        <button type="submit" className="manage-btn manage-btn--primary" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
