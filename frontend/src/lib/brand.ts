/** Parent company every catalogue brand is credited to. */
export const HOUSE_BRAND = 'United Gas & Home Appliances'
export const HOUSE_BRAND_SHORT = 'UGH'

export function displaySiteName(siteName?: string | null) {
  const name = siteName?.trim()
  if (!name || name === 'UGH Appliances') return HOUSE_BRAND
  return name
}

/** e.g. "Mac'sons — a product of United Gas & Home Appliances" */
export function brandCredit(brandName?: string | null) {
  const name = brandName?.trim()
  if (!name) return `A product of ${HOUSE_BRAND}`
  return `${name} — a product of ${HOUSE_BRAND}`
}
