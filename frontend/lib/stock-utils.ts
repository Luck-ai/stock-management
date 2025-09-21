// Centralized stock status utilities to eliminate code duplication

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock"
export type StockVariant = "default" | "secondary" | "destructive"

export interface StockStatusResult {
  label: StockStatus
  variant: StockVariant
}

export interface Product {
  id: string | number
  quantity: number
  lowStockThreshold?: number
  low_stock_threshold?: number
}

/**
 * Normalizes the low stock threshold property name
 */
export function getThreshold(product: Product): number {
  return Number(product.lowStockThreshold ?? product.low_stock_threshold ?? 0)
}

/**
 * Determines stock status based on quantity and threshold
 * Unified logic used across all components
 */
export function getStockStatus(quantity: number, threshold: number): StockStatusResult {
  const qty = Number(quantity ?? 0)
  const th = Number(threshold ?? 0)

  // If no threshold is set, only consider 0 quantity as out of stock
  if (!th || th <= 0) {
    if (qty === 0) return { label: "Out of Stock", variant: "destructive" }
    return { label: "In Stock", variant: "default" }
  }

  // Calculate margin for low stock warning (20% of threshold)
  const margin = Math.ceil(th * 0.2)

  // Out of stock: quantity is below threshold
  if (qty < th) return { label: "Out of Stock", variant: "destructive" }
  
  // Low stock: quantity is within margin of threshold
  if (Math.abs(th - qty) <= margin) return { label: "Low Stock", variant: "secondary" }
  
  // In stock: quantity is well above threshold
  return { label: "In Stock", variant: "default" }
}

/**
 * Gets stock status for a product using normalized threshold
 */
export function getProductStockStatus(product: Product): StockStatusResult {
  return getStockStatus(product.quantity, getThreshold(product))
}

/**
 * Checks if a product is out of stock
 */
export function isOutOfStock(product: Product): boolean {
  const threshold = getThreshold(product)
  const qty = Number(product.quantity ?? 0)
  
  if (!threshold || threshold <= 0) {
    return qty === 0
  }
  
  return qty < threshold
}

/**
 * Checks if a product is low stock (but not out of stock)
 */
export function isLowStock(product: Product): boolean {
  const threshold = getThreshold(product)
  const qty = Number(product.quantity ?? 0)
  
  if (!threshold || threshold <= 0) return false
  
  const margin = Math.ceil(threshold * 0.2)
  return qty >= threshold && Math.abs(threshold - qty) <= margin
}

/**
 * Filters products by stock status
 */
export function filterProductsByStockStatus(products: Product[], status: StockStatus): Product[] {
  return products.filter(product => {
    const stockStatus = getProductStockStatus(product)
    return stockStatus.label === status
  })
}

/**
 * Gets counts of products by stock status
 */
export function getStockCounts(products: Product[]) {
  const outOfStock = products.filter(isOutOfStock).length
  const lowStock = products.filter(p => !isOutOfStock(p) && isLowStock(p)).length
  const inStock = products.length - outOfStock - lowStock

  return {
    outOfStock,
    lowStock,
    inStock,
    total: products.length
  }
}

/**
 * Gets style classes for stock status display
 */
export function getStockStatusClasses(status: StockStatus) {
  switch (status) {
    case "Out of Stock":
      return "text-red-700 font-semibold"
    case "Low Stock":
      return "text-yellow-700 font-semibold"
    case "In Stock":
    default:
      return ""
  }
}

/**
 * Gets badge color classes for stock status
 */
export function getStockBadgeClasses(status: StockStatus) {
  switch (status) {
    case "In Stock":
      return "bg-green-100 text-green-800"
    case "Low Stock":
      return "bg-yellow-100 text-yellow-800"
    case "Out of Stock":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}