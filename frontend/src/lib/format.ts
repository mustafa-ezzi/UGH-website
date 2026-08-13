const currencySymbols: Record<string, string> = {
  PKR: 'Rs',
  USD: '$',
  AED: 'AED',
  EUR: '€',
}

export function formatPrice(price: string | number, currency = 'PKR'): string {
  const value = typeof price === 'string' ? Number(price) : price
  if (Number.isNaN(value)) return String(price)
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(value)
  const symbol = currencySymbols[currency] ?? currency
  return `${symbol} ${formatted}`
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return path
}

/** Digits only for wa.me — keep country code, drop spaces/+/-/() */
export function whatsappDigits(phone: string | null | undefined): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/** Build a WhatsApp click-to-chat URL with optional prefilled text. */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  text: string,
): string | null {
  const digits = whatsappDigits(phone)
  if (!digits) return null
  const encoded = encodeURIComponent(text.trim())
  return encoded
    ? `https://wa.me/${digits}?text=${encoded}`
    : `https://wa.me/${digits}`
}
