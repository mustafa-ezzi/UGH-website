import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchManageSettings, updateManageSettings, type ManageSettings } from '../api'
import { PageHeader } from '../components/PageHeader'

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

  function field<K extends keyof ManageSettings>(key: K, value: ManageSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  if (settings.isLoading) return <p className="manage-muted">Loading settings…</p>

  return (
    <div className="manage-page">
      <PageHeader
        eyebrow="Content"
        title="Site settings"
        description="Brand copy, homepage sections, contact details, and enquiry notifications."
      />

      {error ? <p className="manage-alert">{error}</p> : null}
      {message ? <p className="manage-success">{message}</p> : null}

      <form className="manage-form manage-form--wide" onSubmit={onSubmit}>
        <section className="manage-form-section">
          <h3>Brand</h3>
          <label className="manage-field">
            <span>Site name</span>
            <input value={form.site_name ?? ''} onChange={(e) => field('site_name', e.target.value)} />
          </label>
          <label className="manage-field">
            <span>Tagline</span>
            <input value={form.tagline ?? ''} onChange={(e) => field('tagline', e.target.value)} />
          </label>
          <label className="manage-field">
            <span>Hero supporting text</span>
            <input
              value={form.hero_supporting_text ?? ''}
              onChange={(e) => field('hero_supporting_text', e.target.value)}
            />
          </label>
          <label className="manage-field">
            <span>About</span>
            <textarea
              rows={5}
              value={form.about_blurb ?? ''}
              onChange={(e) => field('about_blurb', e.target.value)}
            />
          </label>
        </section>

        <section className="manage-form-section">
          <h3>Homepage</h3>
          <p className="manage-muted">
            Carousel photos are managed separately under{' '}
            <Link to="/manage/carousel">Carousel</Link>.
          </p>
          <label className="manage-field">
            <span>Quote band</span>
            <input
              value={form.homepage_quote ?? ''}
              onChange={(e) => field('homepage_quote', e.target.value)}
            />
          </label>
          <div className="manage-form__row">
            <label className="manage-field">
              <span>Featured eyebrow</span>
              <input
                value={form.featured_section_eyebrow ?? ''}
                onChange={(e) => field('featured_section_eyebrow', e.target.value)}
              />
            </label>
            <label className="manage-field">
              <span>Featured title</span>
              <input
                value={form.featured_section_title ?? ''}
                onChange={(e) => field('featured_section_title', e.target.value)}
              />
            </label>
          </div>
          <div className="manage-checks">
            <label>
              <input
                type="checkbox"
                checked={Boolean(form.show_featured_section)}
                onChange={(e) => field('show_featured_section', e.target.checked)}
              />
              Show featured section
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(form.show_category_ribbon)}
                onChange={(e) => field('show_category_ribbon', e.target.checked)}
              />
              Show category ribbon
            </label>
          </div>
        </section>

        <section className="manage-form-section">
          <h3>Contact</h3>
          <div className="manage-form__row">
            <label className="manage-field">
              <span>Email</span>
              <input
                value={form.contact_email ?? ''}
                onChange={(e) => field('contact_email', e.target.value)}
              />
            </label>
            <label className="manage-field">
              <span>Phone</span>
              <input
                value={form.contact_phone ?? ''}
                onChange={(e) => field('contact_phone', e.target.value)}
              />
            </label>
          </div>
          <div className="manage-form__row">
            <label className="manage-field">
              <span>WhatsApp</span>
              <input value={form.whatsapp ?? ''} onChange={(e) => field('whatsapp', e.target.value)} />
            </label>
            <label className="manage-field">
              <span>Notify enquiries to</span>
              <input
                value={form.notify_enquiries_to ?? ''}
                onChange={(e) => field('notify_enquiries_to', e.target.value)}
              />
            </label>
          </div>
          <label className="manage-field">
            <span>Address</span>
            <textarea
              rows={3}
              value={form.address ?? ''}
              onChange={(e) => field('address', e.target.value)}
            />
          </label>
        </section>

        <section className="manage-form-section">
          <h3>Social</h3>
          <label className="manage-field">
            <span>Instagram</span>
            <input
              value={form.social_instagram ?? ''}
              onChange={(e) => field('social_instagram', e.target.value)}
            />
          </label>
          <label className="manage-field">
            <span>Facebook</span>
            <input
              value={form.social_facebook ?? ''}
              onChange={(e) => field('social_facebook', e.target.value)}
            />
          </label>
          <label className="manage-field">
            <span>YouTube</span>
            <input
              value={form.social_youtube ?? ''}
              onChange={(e) => field('social_youtube', e.target.value)}
            />
          </label>
        </section>

        <button type="submit" className="manage-btn manage-btn--primary" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
