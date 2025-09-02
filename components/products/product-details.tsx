"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react"
import { SalesChart } from "./sales-chart"
import { StockMovementChart } from "./stock-movement-chart"
import { ProductMetrics } from "./product-metrics"
import type { Product } from "@/components/stock/stock-management"

interface ProductDetailsProps {
  productId: string
}

// Mock data - in a real app, this would come from an API
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    sku: "WH-001",
    category: "Electronics",
    quantity: 45,
    price: 99.99,
    lowStockThreshold: 10,
    supplier: "TechCorp",
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    name: "Bluetooth Speaker",
    sku: "BS-002",
    category: "Electronics",
    quantity: 8,
    price: 79.99,
    lowStockThreshold: 15,
    supplier: "AudioMax",
    lastUpdated: "2024-01-14",
  },
  {
    id: "3",
    name: "USB-C Cable",
    sku: "UC-003",
    category: "Accessories",
    quantity: 120,
    price: 19.99,
    lowStockThreshold: 25,
    supplier: "CableCo",
    lastUpdated: "2024-01-13",
  },
  {
    id: "4",
    name: "Laptop Stand",
    sku: "LS-004",
    category: "Accessories",
    quantity: 3,
    price: 49.99,
    lowStockThreshold: 5,
    supplier: "DeskPro",
    lastUpdated: "2024-01-12",
  },
  {
    id: "5",
    name: "Wireless Mouse",
    sku: "WM-005",
    category: "Electronics",
    quantity: 67,
    price: 29.99,
    lowStockThreshold: 20,
    supplier: "TechCorp",
    lastUpdated: "2024-01-11",
  },
]

export function ProductDetails({ productId }: ProductDetailsProps) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    // In a real app, fetch product data from API
    const foundProduct = mockProducts.find((p) => p.id === productId)
    setProduct(foundProduct || null)
  }, [productId])

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    )
  }

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (quantity <= threshold) return { label: "Low Stock", variant: "secondary" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  const status = getStockStatus(product.quantity, product.lowStockThreshold)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </div>

      {/* Product Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.quantity}</div>
            <Badge variant={status.variant} className="mt-2">
              {status.label}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${product.price}</div>
            <p className="text-xs text-muted-foreground mt-2">Per unit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(product.quantity * product.price).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Current inventory value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.lowStockThreshold}</div>
            <p className="text-xs text-muted-foreground mt-2">Threshold level</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Details and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales History</TabsTrigger>
          <TabsTrigger value="stock">Stock Movement</TabsTrigger>
          <TabsTrigger value="metrics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SKU</p>
                    <p className="text-sm font-mono">{product.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="text-sm">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                    <p className="text-sm">{product.supplier}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{product.lastUpdated}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common operations for this product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full bg-transparent" variant="outline">
                  Adjust Stock Level
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  Update Price
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  Reorder Stock
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  View Supplier Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <SalesChart productId={productId} />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <StockMovementChart productId={productId} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <ProductMetrics productId={productId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
