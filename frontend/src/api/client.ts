import type {
  Brand,
  CarouselSlide,
  Category,
  EnquiryPayload,
  EnquiryResponse,
  Paginated,
  Product,
  ProductQuery,
  SiteSettings,
} from './types'
import { apiUrl } from './base'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(`/api${path}`), {
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const data = (await response.json()) as Record<string, unknown>
      if (typeof data.detail === 'string') detail = data.detail
      else if (data.non_field_errors) detail = String(data.non_field_errors)
    } catch {
      // keep default message
    }
    throw new Error(detail)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function toQuery(params: ProductQuery): string {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.brand) search.set('brand', params.brand)
  if (params.featured !== undefined) search.set('featured', String(params.featured))
  if (params.search) search.set('search', params.search)
  if (params.ordering) search.set('ordering', params.ordering)
  if (params.page) search.set('page', String(params.page))
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function fetchProducts(params: ProductQuery = {}) {
  return request<Paginated<Product>>(`/products/${toQuery(params)}`)
}

export function fetchProduct(slug: string) {
  return request<Product>(`/products/${encodeURIComponent(slug)}/`)
}

export function fetchCategories() {
  return request<Category[]>('/categories/')
}

export function fetchBrands() {
  return request<Brand[]>('/brands/')
}

export function fetchSettings() {
  return request<SiteSettings>('/settings/')
}

export function fetchCarouselSlides() {
  return request<CarouselSlide[]>('/carousel-slides/')
}

export function createEnquiry(payload: EnquiryPayload) {
  return request<EnquiryResponse>('/enquiries/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
