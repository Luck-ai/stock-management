"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StockTable } from "./stock-table"
import { AddProductDialog } from "./add-product-dialog"
import { EditProductDialog } from "./edit-product-dialog"
import { Plus, Search } from "lucide-react"

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  price: number
  lowStockThreshold: number
  supplier: string
  lastUpdated: string
}

// Mock data for demonstration
const initialProducts: Product[] = [
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

export function StockManagement() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const lowStockCount = products.filter((product) => product.quantity <= product.lowStockThreshold).length

  const totalProducts = products.length
  const totalValue = products.reduce((sum, product) => sum + product.quantity * product.price, 0)

  const handleAddProduct = (newProduct: Omit<Product, "id" | "lastUpdated">) => {
    const product: Product = {
      ...newProduct,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split("T")[0],
    }
    setProducts([...products, product])
  }

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts(
      products.map((p) =>
        p.id === updatedProduct.id ? { ...updatedProduct, lastUpdated: new Date().toISOString().split("T")[0] } : p,
      ),
    )
    setEditingProduct(null)
  }

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground">Manage your inventory and track stock levels</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>Search and manage your product inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <StockTable products={filteredProducts} onEdit={setEditingProduct} onDelete={handleDeleteProduct} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddProductDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={handleAddProduct} />

      {editingProduct && (
        <EditProductDialog
          open={!!editingProduct}
          onOpenChange={() => setEditingProduct(null)}
          product={editingProduct}
          onEdit={handleEditProduct}
        />
      )}
    </div>
  )
}
