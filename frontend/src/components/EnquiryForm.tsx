import { useState, type FormEvent } from 'react'
import { useSettings } from '../api/hooks'
import { buildWhatsAppUrl } from '../lib/format'

type EnquiryFormProps = {
  productSlug?: string
  productName?: string
  productSku?: string
}

function defaultMessage(productName?: string) {
  if (productName) {
    return `I would like more information about ${productName} — availability, price, and finishes.`
  }
  return 'I would like more information about your appliances — availability and guidance.'
}

export function EnquiryForm({ productSlug, productName, productSku }: EnquiryFormProps) {
  const settings = useSettings()
  const [name, setName] = useState('')
  const [message, setMessage] = useState(defaultMessage(productName))
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    const whatsapp = settings.data?.whatsapp?.trim()
    if (!whatsapp) {
      setError('WhatsApp number is not set yet. Add it in Manage → Site settings.')
      return
    }

    const siteName = settings.data?.site_name ?? 'UGH Appliances'
    const trimmedName = name.trim()
    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      setError('Please write a short message.')
      return
    }

    const lines = [
      `Hello ${siteName},`,
      '',
      productName
        ? `I am enquiring about: *${productName}*`
        : 'I would like to make an enquiry.',
      productSku ? `SKU: ${productSku}` : null,
      productSlug ? `Product: ${window.location.origin}/product/${productSlug}` : null,
      trimmedName ? `My name: ${trimmedName}` : null,
      '',
      trimmedMessage,
    ]
      .filter((line): line is string => line != null)
      .join('\n')

    const url = buildWhatsAppUrl(whatsapp, lines)
    if (!url) {
      setError('WhatsApp number looks invalid. Use country code, e.g. 923001234567.')
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <form className="enquiry-form" onSubmit={onSubmit} noValidate>
      <p className="u-eyebrow">Enquire</p>
      <h3>{productName ? `Ask about ${productName}` : 'Send an enquiry'}</h3>
      <p className="enquiry-form__hint">
        Opens WhatsApp with a prefilled message — no cart, just a direct chat.
      </p>

      <label className="enquiry-form__field">
        <span>Your name (optional)</span>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Your name"
        />
      </label>

      <label className="enquiry-form__field">
        <span>Message</span>
        <textarea
          name="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>

      {error ? (
        <p className="enquiry-form__error" role="alert">
          {error}
        </p>
      ) : null}

      {!settings.isLoading && !settings.data?.whatsapp ? (
        <p className="enquiry-form__error" role="status">
          WhatsApp is not configured. Set the number in Manage → Site settings.
        </p>
      ) : null}

      <button
        type="submit"
        className="btn-ember"
        disabled={settings.isLoading || !settings.data?.whatsapp}
      >
        Send on WhatsApp
      </button>
    </form>
  )
}
