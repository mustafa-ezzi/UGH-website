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
