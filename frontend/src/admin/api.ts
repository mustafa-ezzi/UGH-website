import { useAuthStore, type ManageUser } from './authStore'
import { apiUrl } from '../api/base'

export type ManageEnquiry = {
  id: number
  name: string
  phone: string
  email: string
  message: string
  product: number | null
  product_name: string | null
  is_handled: boolean
  created_at: string
}

export type ManageDashboard = {
  products_total: number
  products_published: number
  products_featured: number
  enquiries_open: number
  enquiries_total: number
  categories: number
  brands: number
  recent_enquiries: ManageEnquiry[]
}

export type ManageProductImage = {
  id: number
  image_url: string | null
  alt_text: string
  sort_order: number
}

export type ManageProduct = {
  id: number
  name: string
  slug: string
  brand: number
  brand_name: string
  category_ids: number[]
  sku: string
  price: string
  currency: string
  short_description: string
  long_description: string
  specs: Record<string, string>
  is_featured: boolean
  is_published: boolean
  sort_order: number
  images: ManageProductImage[]
  primary_image: string | null
  created_at: string
  updated_at: string
}

export type ManageSettings = {
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
  notify_enquiries_to: string
}

export type ManageBrand = {
  id: number
  name: string
  slug: string
  logo_url: string | null
  description: string
  sort_order: number
  is_active: boolean
}

export type ManageCategory = {
  id: number
  name: string
  slug: string
  parent: number | null
  parent_name: string | null
  hero_image_url: string | null
  description: string
  sort_order: number
  is_active: boolean
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

async function manageRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Token ${token}`)
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(apiUrl(`/api/manage${path}`), {
    ...init,
    headers,
  })

  if (response.status === 401) {
    useAuthStore.getState().clearSession()
    throw new Error('Session expired. Please sign in again.')
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const data = (await response.json()) as Record<string, unknown>
      if (typeof data.detail === 'string') detail = data.detail
      else {
        const first = Object.values(data)[0]
        if (Array.isArray(first) && typeof first[0] === 'string') detail = first[0]
        else if (typeof first === 'string') detail = first
      }
    } catch {
      // keep default
    }
    throw new Error(detail)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function login(username: string, password: string) {
  return manageRequest<{ token: string; user: ManageUser }>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout() {
  return manageRequest<void>('/auth/logout/', { method: 'POST' })
}

export function fetchMe() {
  return manageRequest<ManageUser>('/auth/me/')
}

export function fetchDashboard() {
  return manageRequest<ManageDashboard>('/dashboard/')
}

export function fetchManageProducts(params: {
  search?: string
  page?: number
  is_published?: boolean | ''
  is_featured?: boolean | ''
  brand?: number | ''
} = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', String(params.page))
  if (params.is_published !== undefined && params.is_published !== '') {
    qs.set('is_published', String(params.is_published))
  }
  if (params.is_featured !== undefined && params.is_featured !== '') {
    qs.set('is_featured', String(params.is_featured))
  }
  if (params.brand !== undefined && params.brand !== '') {
    qs.set('brand', String(params.brand))
  }
  const q = qs.toString()
  return manageRequest<Paginated<ManageProduct>>(`/products/${q ? `?${q}` : ''}`)
}

export function fetchManageProduct(id: number) {
  return manageRequest<ManageProduct>(`/products/${id}/`)
}

export function createManageProduct(payload: Partial<ManageProduct>) {
  return manageRequest<ManageProduct>('/products/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateManageProduct(id: number, payload: Partial<ManageProduct>) {
  return manageRequest<ManageProduct>(`/products/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteManageProduct(id: number) {
  return manageRequest<void>(`/products/${id}/`, { method: 'DELETE' })
}

export function bulkUpdateProducts(
  ids: number[],
  flags: { is_published?: boolean; is_featured?: boolean },
) {
  return manageRequest<{ updated: number }>('/products/bulk/', {
    method: 'POST',
    body: JSON.stringify({ ids, ...flags }),
  })
}

export function uploadProductImage(productId: number, file: File, altText = '') {
  const body = new FormData()
  body.append('image', file)
  body.append('alt_text', altText)
  return manageRequest<ManageProductImage>(`/products/${productId}/images/`, {
    method: 'POST',
    body,
  })
}

export function updateProductImage(
  imageId: number,
  payload: { alt_text?: string; sort_order?: number },
) {
  return manageRequest<ManageProductImage>(`/product-images/${imageId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteProductImage(imageId: number) {
  return manageRequest<void>(`/product-images/${imageId}/`, { method: 'DELETE' })
}

export function fetchManageEnquiries(
  params: { is_handled?: boolean; page?: number; search?: string } = {},
) {
  const qs = new URLSearchParams()
  if (params.is_handled !== undefined) qs.set('is_handled', String(params.is_handled))
  if (params.page) qs.set('page', String(params.page))
  if (params.search) qs.set('search', params.search)
  const q = qs.toString()
  return manageRequest<Paginated<ManageEnquiry>>(`/enquiries/${q ? `?${q}` : ''}`)
}

export function updateEnquiry(id: number, payload: { is_handled: boolean }) {
  return manageRequest<ManageEnquiry>(`/enquiries/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function bulkUpdateEnquiries(ids: number[], is_handled: boolean) {
  return manageRequest<{ updated: number }>('/enquiries/bulk/', {
    method: 'POST',
    body: JSON.stringify({ ids, is_handled }),
  })
}

export function fetchManageSettings() {
  return manageRequest<ManageSettings>('/settings/')
}

export function updateManageSettings(payload: Partial<ManageSettings>) {
  return manageRequest<ManageSettings>('/settings/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function fetchManageBrands() {
  return manageRequest<ManageBrand[]>('/brands/')
}

export function createManageBrand(payload: Partial<ManageBrand> & { name: string }) {
  return manageRequest<ManageBrand>('/brands/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateManageBrand(id: number, payload: Partial<ManageBrand>) {
  return manageRequest<ManageBrand>(`/brands/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteManageBrand(id: number) {
  return manageRequest<void>(`/brands/${id}/`, { method: 'DELETE' })
}

export function fetchManageCategories() {
  return manageRequest<ManageCategory[]>('/categories/')
}

export function createManageCategory(payload: Partial<ManageCategory> & { name: string }) {
  return manageRequest<ManageCategory>('/categories/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateManageCategory(id: number, payload: Partial<ManageCategory>) {
  return manageRequest<ManageCategory>(`/categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteManageCategory(id: number) {
  return manageRequest<void>(`/categories/${id}/`, { method: 'DELETE' })
}
