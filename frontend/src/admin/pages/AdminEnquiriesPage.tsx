import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchManageEnquiries, updateEnquiry } from '../api'

export function AdminEnquiriesPage() {
  const [filter, setFilter] = useState<'open' | 'all' | 'handled'>('open')
  const queryClient = useQueryClient()

  const enquiries = useQuery({
    queryKey: ['manage-enquiries', filter],
    queryFn: () =>
      fetchManageEnquiries({
        is_handled: filter === 'all' ? undefined : filter === 'handled',
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

  return (
    <div className="manage-page">
      <header className="manage-page__header">
        <div>
          <p className="manage-brand__eyebrow">Inbox</p>
          <h2>Enquiries</h2>
        </div>
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
      </header>

      {enquiries.isLoading ? <p className="manage-muted">Loading…</p> : null}
      {enquiries.isError ? (
        <p className="manage-alert">{(enquiries.error as Error).message}</p>
      ) : null}

      <div className="manage-enquiry-list">
        {(enquiries.data?.results ?? []).map((item) => (
          <article key={item.id} className={item.is_handled ? 'is-handled' : ''}>
            <header>
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.email || item.phone || 'No contact'}
                  {item.product_name ? ` · ${item.product_name}` : ''}
                </small>
              </div>
              <time dateTime={item.created_at}>
                {new Date(item.created_at).toLocaleString()}
              </time>
            </header>
            <p>{item.message}</p>
            <button
              type="button"
              className="manage-btn"
              onClick={() => toggle.mutate({ id: item.id, is_handled: !item.is_handled })}
            >
              {item.is_handled ? 'Reopen' : 'Mark handled'}
            </button>
          </article>
        ))}
        {enquiries.data && enquiries.data.results.length === 0 ? (
          <p className="manage-muted">No enquiries in this view.</p>
        ) : null}
      </div>
    </div>
  )
}
