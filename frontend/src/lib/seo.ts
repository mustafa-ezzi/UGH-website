import { useEffect } from 'react'
import { HOUSE_BRAND } from './brand'

export const SITE_ORIGIN = 'https://www.macsonspk.com'
export const SITE_NAME = "Macson's Home Appliances"

export const DEFAULT_TITLE = `${SITE_NAME} | Stoves, Chimneys, Ovens & Sinks`
export const DEFAULT_DESCRIPTION = `Macson's is a product of ${HOUSE_BRAND}. Explore built-in hobs, kitchen chimneys, ovens, and sinks in Pakistan. Browse the catalogue and enquire at macsonspk.com.`

type SeoProps = {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noindex = false,
}: SeoProps) {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:locale', 'en_PK')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [title, description, path, noindex])

  return null
}
