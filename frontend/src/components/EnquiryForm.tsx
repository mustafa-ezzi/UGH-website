import { useState, type FormEvent } from 'react'
import { useCreateEnquiry } from '../api/hooks'

type EnquiryFormProps = {
  productSlug?: string
  productName?: string
}

export function EnquiryForm({ productSlug, productName }: EnquiryFormProps) {
  const mutation = useCreateEnquiry()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(
    productName ? `I would like more information about ${productName}.` : '',
  )

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      message: message.trim(),
      product_slug: productSlug,
    })
  }

  if (mutation.isSuccess) {
    return (
      <div className="enquiry-form enquiry-form--success">
        <p className="u-eyebrow">Sent</p>
        <h3>Thank you</h3>
        <p>We received your enquiry and will respond with availability and guidance.</p>
      </div>
    )
  }

  return (
    <form className="enquiry-form" onSubmit={onSubmit} noValidate>
      <p className="u-eyebrow">Enquire</p>
      <h3>{productName ? `Ask about ${productName}` : 'Send an enquiry'}</h3>
      <p className="enquiry-form__hint">
        Showcase catalogue only — no cart. Leave email or phone so we can reach you.
      </p>

      <label className="enquiry-form__field">
        <span>Name</span>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </label>

      <div className="enquiry-form__row">
        <label className="enquiry-form__field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="enquiry-form__field">
          <span>Phone</span>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
      </div>

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

      {mutation.isError ? (
        <p className="enquiry-form__error" role="alert">
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'Could not send enquiry. Try again.'}
        </p>
      ) : null}

      <button type="submit" className="btn-ember" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  )
}
