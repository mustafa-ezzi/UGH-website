import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { bulkUpdateEnquiries, fetchManageEnquiries, updateEnquiry } from '../api'
import { EmptyState, PageHeader } from '../components/PageHeader'

export function AdminEnquiriesPage() {
  const [filter, setFilter] = useState<'open' | 'all' | 'handled'>('open')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const queryClient = useQueryClient()

  const enquiries = useQuery({
    queryKey: ['manage-enquiries', filter, q],
    queryFn: () =>
      fetchManageEnquiries({
        is_handled: filter === 'all' ? undefined : filter === 'handled',
        search: q || undefined,
      }),
  })

  const toggle = useMutation({
    mutationFn: ({ id, is_handled }: { id: number; is_handled: boolean }) =>
      updateEnquiry(id, { is_handled }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manage-enquiries'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
    },
  })

  const bulk = useMutation({
    mutationFn: (is_handled: boolean) => bulkUpdateEnquiries(selected, is_handled),
    onSuccess: () => {
      setSelected([])
      void queryClient.invalidateQueries({ queryKey: ['manage-enquiries'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
    },
  })

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setQ(search.trim())
  }

  return (
    <div className="manage-page">
      <PageHeader
        eyebrow="Inbox"
        title="Enquiries"
        description="Leads from the storefront contact and product forms."
        actions={
          <div className="manage-segment">
            {(['open', 'handled', 'all'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={filter === key ? 'is-active' : ''}
                onClick={() => setFilter(key)}
              >
                {key}
              </button>
            ))}
          </div>
        }
      />

      <form className="manage-toolbar" onSubmit={onSearch}>
        <input
          placeholder="Search name, email, message…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="manage-btn">
          Search
        </button>
      </form>

      {selected.length > 0 ? (
        <div className="manage-bulkbar">
          <span>{selected.length} selected</span>
          <button type="button" className="manage-btn" onClick={() => bulk.mutate(true)}>
            Mark handled
          </button>
          <button type="button" className="manage-btn" onClick={() => bulk.mutate(false)}>
            Reopen
          </button>
          <button type="button" className="manage-btn manage-btn--ghost" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      ) : null}

      {enquiries.isLoading ? <p className="manage-muted">Loading…</p> : null}
      {enquiries.isError ? (
        <p className="manage-alert">{(enquiries.error as Error).message}</p>
      ) : null}

      <div className="manage-enquiry-list">
        {(enquiries.data?.results ?? []).map((item) => (
          <article key={item.id} className={item.is_handled ? 'is-handled' : ''}>
            <header>
              <label className="manage-enquiry-list__check">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() =>
                    setSelected((prev) =>
                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                    )
                  }
                />
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {[item.email, item.phone].filter(Boolean).join(' · ') || 'No contact'}
                    {item.product_name ? ` · ${item.product_name}` : ''}
                  </small>
                </div>
              </label>
              <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
            </header>
            <p>{item.message}</p>
            <div className="manage-enquiry-list__actions">
              {item.email ? (
                <a className="manage-btn" href={`mailto:${item.email}`}>
                  Email
                </a>
              ) : null}
              {item.phone ? (
                <a className="manage-btn" href={`tel:${item.phone}`}>
                  Call
                </a>
              ) : null}
              <button
                type="button"
                className="manage-btn manage-btn--primary"
                onClick={() => toggle.mutate({ id: item.id, is_handled: !item.is_handled })}
              >
                {item.is_handled ? 'Reopen' : 'Mark handled'}
              </button>
            </div>
          </article>
        ))}
        {enquiries.data && enquiries.data.results.length === 0 ? (
          <EmptyState title="No enquiries in this view" detail="New leads will land here." />
        ) : null}
      </div>
    </div>
  )
}
