import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="manage-page__header">
      <div>
        <p className="manage-brand__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="manage-page__desc">{description}</p> : null}
      </div>
      {actions ? <div className="manage-page__actions">{actions}</div> : null}
    </header>
  )
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="manage-empty">
      <strong>{title}</strong>
      {detail ? <p>{detail}</p> : null}
    </div>
  )
}
