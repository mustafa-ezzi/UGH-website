/** House brand shown on the storefront for every product. */
export const HOUSE_BRAND = 'United Gas & Home Appliances'
export const HOUSE_BRAND_SHORT = 'UGH'

/** Prefer the full house name over the old short label. */
export function displaySiteName(siteName?: string | null) {
  const name = siteName?.trim()
  if (!name || name === 'UGH Appliances') return HOUSE_BRAND
  return name
}
