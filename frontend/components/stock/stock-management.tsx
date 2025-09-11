"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StockTable } from "./stock-table"
import { AddProductDialog } from "./add-product-dialog"
import { EditProductDialog } from "./edit-product-dialog"
import { SupplierForm, CategoryForm } from "./forms"
import { Plus, Search } from "lucide-react"
import { apiFetch } from '@/lib/api'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  description: string
  quantity: number
  price: number
  lowStockThreshold: number
  supplier: string
  lastUpdated: string
}

export function StockManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Fetch suppliers and categories from backend on mount
  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const [prodsRes, catsRes, supsRes] = await Promise.all([
          apiFetch('/products/'),
          apiFetch('/categories/'),
          apiFetch('/suppliers/'),
        ])

        if (!mounted) return

        if (prodsRes.ok) {
          const prodsData = await prodsRes.json()
          const mapped = Array.isArray(prodsData)
            ? prodsData.map((p: any) => ({
                id: String(p.id ?? ""),
                name: p.name ?? "",
                sku: p.sku ?? "",
                category: p.category?.name ?? p.category ?? "",
                description: p.description ?? "",
                quantity: Number(p.quantity ?? 0),
                price: Number(p.price ?? 0),
                lowStockThreshold: Number(p.low_stock_threshold ?? p.lowStockThreshold ?? 0),
                supplier: p.supplier?.name ?? p.supplier ?? "",
                lastUpdated: p.last_updated ?? p.lastUpdated ?? "",
              }))
            : []
          if (mapped.length) setProducts(mapped)
        }

        if (catsRes.ok) {
          const catsData = await catsRes.json()
          const names = Array.isArray(catsData) ? catsData.map((c: any) => (typeof c === "string" ? c : c.name ?? String(c))) : []
          if (names.length) setCategories(names)
        }

        if (supsRes.ok) {
          const supsData = await supsRes.json()
          const names = Array.isArray(supsData) ? supsData.map((s: any) => (typeof s === "string" ? s : s.name ?? String(s))) : []
          if (names.length) setSuppliers(names)
        }
      } catch (err) {
        console.error("Error fetching products, categories or suppliers", err)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

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

  // Persist a new supplier to the backend
  const handleAddSupplier = async (supplier: { name: string; email?: string; phone?: string; address?: string }) => {
    try {
      const res = await apiFetch('/suppliers/', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: supplier.name, email: supplier.email, phone: supplier.phone, address: supplier.address }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error("Failed to create supplier", err)
        return
      }
      const created = await res.json()
      console.log("Supplier created", created)
      // optionally update local product supplier lists or UI
    } catch (err) {
      console.error("Error creating supplier", err)
    }
  }

  // Persist a new category to the backend
  const handleCreateCategory = async (category: { name: string; description?: string }) => {
    try {
      const res = await apiFetch('/categories/', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: category.name, description: category.description }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error("Failed to create category", err)
        return
      }
      const created = await res.json()
      console.log("Category created", created)
    } catch (err) {
      console.error("Error creating category", err)
    }
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

  // Handlers for supplier/category dialogs
  const handleSaveSupplier = async (s: { name: string; email?: string; phone?: string; address?: string }) => {
    try {
      const res = await apiFetch('/suppliers/', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.name, email: s.email, phone: s.phone, address: s.address }),
      })
      if (res.ok) {
        const created = await res.json()
        setSuppliers((prev) => (prev.includes(created.name) ? prev : [...prev, created.name]))
        setIsAddSupplierOpen(false)
      } else {
        console.error("Failed to create supplier", await res.text())
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveCategory = async (c: { name: string; description?: string }) => {
    try {
      const res = await apiFetch('/categories/', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: c.name, description: c.description }),
      })
      if (res.ok) {
        const created = await res.json()
        setCategories((prev) => (prev.includes(created.name) ? prev : [...prev, created.name]))
        setIsCreateCategoryOpen(false)
      } else {
        console.error("Failed to create category", await res.text())
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground">Manage your inventory and track stock levels</p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => setIsAddSupplierOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
          <Button onClick={() => setIsCreateCategoryOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Category
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
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
      <AddProductDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={handleAddProduct} suppliers={suppliers} categories={categories} />

      {/* Controlled dialogs for supplier and category (use Dialog UI from forms) */}
      <SupplierForm
        open={isAddSupplierOpen}
        onOpenChange={setIsAddSupplierOpen}
        onCancel={() => setIsAddSupplierOpen(false)}
        onSave={(s) => handleSaveSupplier(s)}
      />

      <CategoryForm
        open={isCreateCategoryOpen}
        onOpenChange={setIsCreateCategoryOpen}
        onCancel={() => setIsCreateCategoryOpen(false)}
        onSave={(c) => handleSaveCategory(c)}
      />

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
