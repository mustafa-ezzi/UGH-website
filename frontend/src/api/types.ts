export type Brand = {
  id: number
  name: string
  slug: string
  logo: string | null
  description: string
  sort_order: number
}

export type Category = {
  id: number
  name: string
  slug: string
  parent: number | null
  parent_slug: string | null
  hero_image: string | null
  description: string
  sort_order: number
}

export type ProductImage = {
  id: number
  image: string
  alt_text: string
  sort_order: number
}

export type PrimaryImage = {
  id: number
  url: string
  alt_text: string
}

export type Product = {
  id: number
  name: string
  slug: string
  brand: Brand
  categories: Category[]
  sku: string
  price: string
  currency: string
  short_description: string
  is_featured: boolean
  primary_image: PrimaryImage | null
  sort_order: number
  long_description?: string
  specs?: Record<string, string | number | boolean | null>
  images?: ProductImage[]
  created_at?: string
  updated_at?: string
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type SiteSettings = {
  site_name: string
  tagline: string
  hero_supporting_text: string
  about_blurb: string
  contact_email: string
  contact_phone: string
  whatsapp: string
  address: string
  social_instagram: string
  social_facebook: string
  social_youtube: string
  hero_image: string | null
  homepage_quote: string
  featured_section_title: string
  featured_section_eyebrow: string
  show_featured_section: boolean
  show_category_ribbon: boolean
}

export type EnquiryPayload = {
  name: string
  phone?: string
  email?: string
  message: string
  product_slug?: string
}

export type EnquiryResponse = {
  id: number
  name: string
  phone: string
  email: string
  message: string
  product: number | null
  created_at: string
}

export type ProductQuery = {
  category?: string
  brand?: string
  featured?: boolean
  search?: string
  ordering?: string
  page?: number
}
