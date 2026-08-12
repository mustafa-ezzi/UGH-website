import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createEnquiry,
  fetchBrands,
  fetchCarouselSlides,
  fetchCategories,
  fetchProduct,
  fetchProducts,
  fetchSettings,
} from './client'
import type { EnquiryPayload, ProductQuery } from './types'

export function useProducts(params: ProductQuery = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
  })
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug!),
    enabled: Boolean(slug),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })
}

export function useCarouselSlides() {
  return useQuery({
    queryKey: ['carousel-slides'],
    queryFn: fetchCarouselSlides,
  })
}

export function useCreateEnquiry() {
  return useMutation({
    mutationFn: (payload: EnquiryPayload) => createEnquiry(payload),
  })
}
