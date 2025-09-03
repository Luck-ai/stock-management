"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient, handleApiError } from "@/lib/api"

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useApi<T>(apiCall: () => Promise<T>, dependencies: any[] = []): UseApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}

// Specific hooks for common API calls
export function useProducts(params?: {
  skip?: number
  limit?: number
  category?: string
  search?: string
}) {
  return useApi(() => apiClient.getProducts(params), [params?.skip, params?.limit, params?.category, params?.search])
}

export function useProduct(id: number) {
  return useApi(() => apiClient.getProduct(id), [id])
}

export function useInventoryStats() {
  return useApi(() => apiClient.getInventoryStats())
}

export function useSalesAnalytics(params?: {
  start_date?: string
  end_date?: string
  group_by?: "day" | "week" | "month"
}) {
  return useApi(() => apiClient.getSalesAnalytics(params), [params?.start_date, params?.end_date, params?.group_by])
}

export function useCategoryPerformance() {
  return useApi(() => apiClient.getCategoryPerformance())
}

export function usePurchaseOrders() {
  return useApi(() => apiClient.getPurchaseOrders())
}

export function useSuppliers() {
  return useApi(() => apiClient.getSuppliers())
}

export function useRestockSuggestions() {
  return useApi(() => apiClient.getRestockSuggestions())
}

// Mutation hook for API calls that modify data
export function useApiMutation<T, P = void>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (apiCall: (params: P) => Promise<T>, params: P): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall(params)
      return result
    } catch (err) {
      setError(handleApiError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    mutate,
    loading,
    error,
    clearError: () => setError(null),
  }
}
