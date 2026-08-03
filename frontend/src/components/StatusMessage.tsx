type StatusMessageProps = {
  tone?: 'neutral' | 'error' | 'success'
  title: string
  detail?: string
}

export function StatusMessage({ tone = 'neutral', title, detail }: StatusMessageProps) {
  return (
    <div className={`status-message status-message--${tone}`} role="status">
      <p className="status-message__title">{title}</p>
      {detail ? <p className="status-message__detail">{detail}</p> : null}
    </div>
  )
}
