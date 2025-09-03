const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || "v1"

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export class ApiError {
  message: string
  status: number
  details?: any

  constructor(error: { message: string; status: number; details?: any }) {
    this.message = error.message
    this.status = error.status
    this.details = error.details
  }
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface User {
  id: number
  email: string
  full_name: string
  is_active: boolean
  created_at: string
}

// Product types
export interface Product {
  id: number
  name: string
  sku: string
  description?: string
  category: string
  price: number
  cost: number
  stock_quantity: number
  min_stock_level: number
  max_stock_level: number
  supplier_id?: number
  supplier_name?: string
  created_at: string
  updated_at: string
}

export interface CreateProductRequest {
  name: string
  sku: string
  description?: string
  category: string
  price: number
  cost: number
  stock_quantity: number
  min_stock_level: number
  max_stock_level: number
  supplier_id?: number
}

// Stock Movement types
export interface StockMovement {
  id: number
  product_id: number
  movement_type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  reason: string
  reference_number?: string
  created_at: string
  created_by: number
}

// Sales types
export interface Sale {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  total_amount: number
  sale_date: string
  customer_name?: string
  created_at: string
}

// Purchase Order types
export interface PurchaseOrder {
  id: number
  supplier_id: number
  status: "PENDING" | "APPROVED" | "ORDERED" | "RECEIVED" | "CANCELLED"
  total_amount: number
  order_date: string
  expected_delivery: string
  items: PurchaseOrderItem[]
  created_at: string
}

export interface PurchaseOrderItem {
  id: number
  product_id: number
  quantity: number
  unit_cost: number
  total_cost: number
}

// Supplier types
export interface Supplier {
  id: number
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  created_at: string
}

// API Client class
class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/${API_VERSION}`
    // Get token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError({
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          details: errorData,
        })
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError({
        message: error instanceof Error ? error.message : "Network error occurred",
        status: 0,
        details: error,
      })
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const formData = new FormData()
    formData.append("username", credentials.email)
    formData.append("password", credentials.password)

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError({
        message: errorData.detail || "Login failed",
        status: response.status,
        details: errorData,
      })
    }

    const data = await response.json()
    this.token = data.access_token

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("user", JSON.stringify(data.user))
    }

    return data
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<void> {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me")
  }

  // Product methods
  async getProducts(params?: {
    skip?: number
    limit?: number
    category?: string
    search?: string
  }): Promise<{ items: Product[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append("skip", params.skip.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.category) searchParams.append("category", params.category)
    if (params?.search) searchParams.append("search", params.search)

    const query = searchParams.toString()
    return this.request<{ items: Product[]; total: number }>(`/products${query ? `?${query}` : ""}`)
  }

  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`)
  }

  async createProduct(product: CreateProductRequest): Promise<Product> {
    return this.request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    })
  }

  async updateProduct(id: number, product: Partial<CreateProductRequest>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    })
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: "DELETE",
    })
  }

  // Stock movement methods
  async getStockMovements(productId?: number): Promise<StockMovement[]> {
    const query = productId ? `?product_id=${productId}` : ""
    return this.request<StockMovement[]>(`/stock-movements${query}`)
  }

  async createStockMovement(movement: Omit<StockMovement, "id" | "created_at" | "created_by">): Promise<StockMovement> {
    return this.request<StockMovement>("/stock-movements", {
      method: "POST",
      body: JSON.stringify(movement),
    })
  }

  // Sales methods
  async getSales(params?: {
    product_id?: number
    start_date?: string
    end_date?: string
  }): Promise<Sale[]> {
    const searchParams = new URLSearchParams()
    if (params?.product_id) searchParams.append("product_id", params.product_id.toString())
    if (params?.start_date) searchParams.append("start_date", params.start_date)
    if (params?.end_date) searchParams.append("end_date", params.end_date)

    const query = searchParams.toString()
    return this.request<Sale[]>(`/sales${query ? `?${query}` : ""}`)
  }

  async createSale(sale: Omit<Sale, "id" | "created_at">): Promise<Sale> {
    return this.request<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(sale),
    })
  }

  // Analytics methods
  async getInventoryStats(): Promise<{
    total_products: number
    total_value: number
    low_stock_count: number
    out_of_stock_count: number
  }> {
    return this.request("/analytics/inventory-stats")
  }

  async getSalesAnalytics(params?: {
    start_date?: string
    end_date?: string
    group_by?: "day" | "week" | "month"
  }): Promise<{
    total_sales: number
    total_revenue: number
    sales_by_period: Array<{ period: string; sales: number; revenue: number }>
  }> {
    const searchParams = new URLSearchParams()
    if (params?.start_date) searchParams.append("start_date", params.start_date)
    if (params?.end_date) searchParams.append("end_date", params.end_date)
    if (params?.group_by) searchParams.append("group_by", params.group_by)

    const query = searchParams.toString()
    return this.request(`/analytics/sales${query ? `?${query}` : ""}`)
  }

  async getCategoryPerformance(): Promise<
    Array<{
      category: string
      total_products: number
      total_sales: number
      total_revenue: number
      avg_margin: number
    }>
  > {
    return this.request("/analytics/category-performance")
  }

  // Purchase Order methods
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.request<PurchaseOrder[]>("/purchase-orders")
  }

  async createPurchaseOrder(order: {
    supplier_id: number
    items: Array<{ product_id: number; quantity: number; unit_cost: number }>
    expected_delivery: string
  }): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(order),
    })
  }

  async updatePurchaseOrderStatus(id: number, status: PurchaseOrder["status"]): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/purchase-orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
  }

  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return this.request<Supplier[]>("/suppliers")
  }

  async createSupplier(supplier: Omit<Supplier, "id" | "created_at">): Promise<Supplier> {
    return this.request<Supplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(supplier),
    })
  }

  // Restock suggestions
  async getRestockSuggestions(): Promise<
    Array<{
      product: Product
      suggested_quantity: number
      urgency: "low" | "medium" | "high"
      days_until_stockout: number
    }>
  > {
    return this.request("/restock/suggestions")
  }
}

// Create and export API client instance
export const apiClient = new ApiClient()

// Utility functions
export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token)
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token")
  }
  return null
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

// Error handling utility
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred"
}
