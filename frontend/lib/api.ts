export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

// Global token expiry handler - will be set by AuthProvider
let tokenExpiryHandler: (() => void) | null = null

export function setTokenExpiryHandler(handler: () => void) {
  tokenExpiryHandler = handler
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // If the caller provided a body, don't overwrite Content-Type when the body is a FormData
  // The browser will set the correct multipart/form-data boundary header for FormData
  const body = (options as any).body
  if (!headers['Content-Type'] && body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  
  // Handle token expiration
  if (res.status === 401 && tokenExpiryHandler) {
    tokenExpiryHandler()
  }
  
  return res
}

// Types for restock functionality
export interface Product {
  id: number
  name: string
  sku: string | null
  category_id: number | null
  description: string | null
  price: number
  quantity: number
  low_stock_threshold: number
  supplier_id: number | null
  user_id: number | null
  last_updated: string | null
  supplier: Supplier | null
  category: ProductCategory | null
}

export interface Supplier {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  user_id: number | null
}

export interface ProductCategory {
  id: number
  name: string
  description: string | null
  user_id: number | null
}

export interface PurchaseOrder {
  id: number
  user_id: number
  supplier_id: number | null
  product_id: number
  quantity_ordered: number
  status: string
  order_date: string | null
  notes: string | null
  notify_by_email?: boolean
  supplier: Supplier | null
  product: Product | null
  on_time_delivery?: number | null
  quality_score?: number | null
  cost_efficiency?: number | null
  overall_rating?: number | null
}

export interface PurchaseOrderCreate {
  supplier_id?: number | null
  product_id: number
  quantity_ordered: number
  status?: string
  notes?: string | null
  notify_by_email?: boolean
}

export interface RestockSummary {
  pending_orders: number
  low_stock_items: number
  out_of_stock_items: number
  total_pending_value: number
}

export async function getRestockSummary(): Promise<RestockSummary> {
  const res = await apiFetch('/restock/summary')
  if (!res.ok) {
    throw new Error('Failed to fetch restock summary')
  }
  return res.json()
}

export async function createPurchaseOrder(order: PurchaseOrderCreate): Promise<PurchaseOrder> {
  const res = await apiFetch('/restock/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
  if (!res.ok) {
    throw new Error('Failed to create purchase order')
  }
  return res.json()
}

export async function createPurchaseOrdersBatch(orders: PurchaseOrderCreate[]): Promise<PurchaseOrder[]> {
  const res = await apiFetch('/restock/orders/batch', {
    method: 'POST',
    body: JSON.stringify({ orders }),
  })
  if (!res.ok) {
    throw new Error('Failed to create purchase orders (batch)')
  }
  return res.json()
}

export async function getPurchaseOrders(status?: string): Promise<PurchaseOrder[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : ''
  const res = await apiFetch(`/restock/orders${params}`)
  if (!res.ok) {
    throw new Error('Failed to fetch purchase orders')
  }
  return res.json()
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const res = await apiFetch(`/restock/orders/${id}`)
  if (!res.ok) {
    throw new Error('Failed to fetch purchase order')
  }
  return res.json()
}

export async function updatePurchaseOrder(id: number, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
  const res = await apiFetch(`/restock/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    throw new Error('Failed to update purchase order')
  }
  return res.json()
}

export async function ratePurchaseOrder(id: number, rating: { on_time_delivery?: number; quality_score?: number; cost_efficiency?: number; overall_rating?: number }): Promise<PurchaseOrder> {
  return updatePurchaseOrder(id, rating as Partial<PurchaseOrder>)
}

export async function deletePurchaseOrder(id: number): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/restock/orders/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error('Failed to delete purchase order')
  }
  return res.json()
}

// Products API functions
export async function getProducts(): Promise<Product[]> {
  const res = await apiFetch('/products')
  if (!res.ok) {
    throw new Error('Failed to fetch products')
  }
  return res.json()
}

export async function getSuppliers(): Promise<Supplier[]> {
  const res = await apiFetch('/suppliers')
  if (!res.ok) {
    throw new Error('Failed to fetch suppliers')
  }
  return res.json()
}

// Sales / Analytics API functions
export interface ProductSale {
  id: number
  product_id: number
  user_id?: number | null
  quantity: number
  sale_price: number
  sale_date?: string | null
}

export async function getSales(): Promise<ProductSale[]> {
  const res = await apiFetch('/sales')
  if (!res.ok) {
    throw new Error('Failed to fetch sales')
  }
  return res.json()
}

export async function getProductSales(productId: number): Promise<ProductSale[]> {
  const res = await apiFetch(`/sales/product/${productId}`)
  if (!res.ok) {
    throw new Error('Failed to fetch product sales')
  }
  return res.json()
}

export async function getCategories(): Promise<ProductCategory[]> {
  const res = await apiFetch('/categories')
  if (!res.ok) {
    throw new Error('Failed to fetch categories')
  }
  return res.json()
}

// Best-effort: top products/categories can be computed client-side from sales/products
export async function getTopProducts(limit = 10): Promise<{ name: string; sales: number; revenue: number }[]> {
  // Fetch all sales and products and compute aggregates in the client
  const [sales, products] = await Promise.all([getSales(), getProducts()])

  const productMap = new Map<number, Product>()
  products.forEach((p) => productMap.set(p.id, p))

  const agg = new Map<number, { sales: number; revenue: number }>()

  sales.forEach((s: any) => {
    const pid = s.product_id
    const entry = agg.get(pid) || { sales: 0, revenue: 0 }
    entry.sales += s.quantity
    entry.revenue += s.quantity * (s.sale_price || (productMap.get(pid)?.price || 0) / 100)
    agg.set(pid, entry)
  })

  const arr = Array.from(agg.entries()).map(([pid, v]) => ({
    name: productMap.get(pid)?.name || `Product ${pid}`,
    sales: v.sales,
    revenue: v.revenue,
  }))

  arr.sort((a, b) => b.sales - a.sales)
  return arr.slice(0, limit)
}

export type TimeRange = string

export function parseTimeRange(timeRange: TimeRange): Date | null {
  if (!timeRange) return null
  if (timeRange === 'all') return null

  const now = new Date()
  const m = timeRange.match(/^(\d+)([dmy])$/)
  if (!m) return null

  const n = parseInt(m[1], 10)
  const unit = m[2]

  switch (unit) {
    case 'd':
      return new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
    case 'm':
      return new Date(now.getFullYear(), now.getMonth() - n, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds())
    case 'y':
      return new Date(now.getFullYear() - n, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds())
    default:
      return null
  }
}

export function filterByTimeRange<T extends Record<string, any>>(items: T[], timeRange: TimeRange, dateField = 'sale_date'): T[] {
  const since = parseTimeRange(timeRange)
  if (!since) return items

  return items.filter((it) => {
    const raw = it?.[dateField]
    if (!raw) return false
    const d = new Date(raw)
    if (isNaN(d.getTime())) return false
    return d >= since
  })
}
