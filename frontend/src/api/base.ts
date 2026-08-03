/** Public API origin. Empty = same-origin `/api` (Vite proxy in local dev). */
export const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function apiUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_ORIGIN}${normalized}`
}
