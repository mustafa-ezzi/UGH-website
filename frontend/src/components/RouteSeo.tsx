import { useLocation } from 'react-router-dom'
import { HOUSE_BRAND } from '../lib/brand'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, Seo } from '../lib/seo'

export function RouteSeo() {
  const { pathname } = useLocation()

  if (pathname.startsWith('/product/')) return null

  if (pathname.startsWith('/catalogue')) {
    const category = pathname.split('/')[2]
    const label = category
      ? category.replace(/-/g, ' ')
      : 'kitchen appliances'
    return (
      <Seo
        path={pathname}
        title={`${label.replace(/\b\w/g, (c) => c.toUpperCase())} | ${SITE_NAME}`}
        description={`Browse ${label} from Macson's, a product of ${HOUSE_BRAND}. Stoves, chimneys, ovens, and sinks — enquire for availability.`}
      />
    )
  }

  if (pathname.startsWith('/about')) {
    return (
      <Seo
        path="/about"
        title={`About Macson's | ${HOUSE_BRAND}`}
        description={`Macson's is a product of ${HOUSE_BRAND}. Kitchen appliances chosen with partners for real homes — hobs, hoods, ovens, and basins.`}
      />
    )
  }

  if (pathname.startsWith('/contact')) {
    return (
      <Seo
        path="/contact"
        title={`Enquire | ${SITE_NAME}`}
        description={`Contact Macson's for appliance availability, finishes, and guidance. A product of ${HOUSE_BRAND}. No cart — enquire directly.`}
      />
    )
  }

  return <Seo path="/" title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} />
}
