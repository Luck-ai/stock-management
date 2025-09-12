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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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
  // Optional server-provided status/warning fields
  statusLabel?: string
  statusVariant?: string
  isLowStockFlag?: boolean
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
        // Parse categories and suppliers first so we can resolve names when products only include ids
        const catsData = catsRes.ok ? await catsRes.json().catch(() => []) : []
        const supsData = supsRes.ok ? await supsRes.json().catch(() => []) : []

        // Build lookup maps
        const catById: Record<string, string> = {}
        if (Array.isArray(catsData)) {
          for (const c of catsData) {
            if (c && typeof c === 'object' && (c.id ?? c.name)) {
              const id = String(c.id ?? c.name)
              const name = c.name ?? String(c)
              catById[id] = name
            }
          }
        }

        const supById: Record<string, string> = {}
        if (Array.isArray(supsData)) {
          for (const s of supsData) {
            if (s && typeof s === 'object' && (s.id ?? s.name)) {
              const id = String(s.id ?? s.name)
              const name = s.name ?? String(s)
              supById[id] = name
            }
          }
        }

        if (prodsRes.ok) {
          const prodsData = await prodsRes.json()
          const mapped = Array.isArray(prodsData)
            ? prodsData.map((p: any) => {
                // Resolve category name from nested object, id, or category_id using lookup map
                const rawCategory = p.category ?? p.category_id ?? null
                let categoryName = ''
                if (rawCategory) {
                  if (typeof rawCategory === 'object') {
                    categoryName = rawCategory.name ?? String(rawCategory)
                  } else {
                    // rawCategory may be id or string name
                    categoryName = String(rawCategory)
                    // if it's an id and exists in catById, prefer the mapped name
                    if (catById[String(rawCategory)]) categoryName = catById[String(rawCategory)]
                  }
                }
                // Resolve supplier similarly
                const rawSupplier = p.supplier ?? p.supplier_id ?? null
                let supplierName = ''
                if (rawSupplier) {
                  if (typeof rawSupplier === 'object') {
                    supplierName = rawSupplier.name ?? String(rawSupplier)
                  } else {
                    supplierName = String(rawSupplier)
                    if (supById[String(rawSupplier)]) supplierName = supById[String(rawSupplier)]
                  }
                }

                return ({
                  id: String(p.id ?? ""),
                  name: p.name ?? "",
                  sku: p.sku ?? "",
                  category: categoryName ?? "",
                  description: p.description ?? "",
                  quantity: Number(p.quantity ?? 0),
                  price: Number(p.price ?? 0),
                  lowStockThreshold: Number(p.low_stock_threshold ?? p.lowStockThreshold ?? 0),
                  // include optional server-provided fields so children receive them
                  statusLabel: p.status ?? p.quantity_warning_label ?? undefined,
                  statusVariant: p.quantity_warning_variant ?? undefined,
                  isLowStockFlag: typeof p.is_low_stock === 'boolean' ? p.is_low_stock : undefined,
                  supplier: supplierName ?? "",
                  lastUpdated: p.last_updated ?? p.lastUpdated ?? "",
                })
              })
            : []
            if (mapped.length) setProducts(mapped)
          }

        // Use the already-parsed catsData and supsData to populate names lists
        const categoryNames = Array.isArray(catsData) ? catsData.map((c: any) => (typeof c === "string" ? c : c.name ?? String(c))) : []
        if (categoryNames.length) setCategories(categoryNames)

        const supplierNames = Array.isArray(supsData) ? supsData.map((s: any) => (typeof s === "string" ? s : s.name ?? String(s))) : []
        if (supplierNames.length) setSuppliers(supplierNames)
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

  const handleAddProduct = async (newProduct: Omit<Product, "id" | "lastUpdated">) => {
    // Immediately add the product to local state so UI updates quickly.
    // We'll attempt to resolve a numeric category id (or missing category) shortly after and patch it in-place.
    const tempId = Date.now().toString()
    const product: Product = {
      ...newProduct,
      category: newProduct.category || "",
      id: tempId,
      lastUpdated: new Date().toISOString().split("T")[0],
    }
    setProducts((prev) => [...prev, product])

    // If category is numeric (an id) or empty, try to resolve the display name from the server
    const originalCategory = String(newProduct.category ?? "").trim()
    if (!originalCategory || /^\d+$/.test(originalCategory)) {
      try {
        const res = await apiFetch('/categories/')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            // Try to find by id or by name
            const found = data.find((c: any) => String(c.id) === originalCategory || String(c.name) === originalCategory)
            const resolved = found ? (found.name ?? String(found)) : originalCategory
            // Patch the product in state with the resolved name (if any)
            setProducts((prev) => prev.map((p) => (p.id === tempId ? { ...p, category: resolved || p.category } : p)))
          }
        }
      } catch (err) {
        // ignore resolution errors; product stays as initially added
      }
    }
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
    // open confirmation dialog and perform deletion on confirm
    setPendingDelete({ id, name: undefined })
    setConfirmOpen(true)
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name?: string } | null>(null)

  async function performDeleteProduct(id: string) {
    try {
      const url = `/products/${id}`
  // Request details: API base + path
      const res = await apiFetch(url, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error('Failed to delete product', { status: res.status, body: text })
        window.alert('Failed to delete product')
        setConfirmOpen(false)
        return
      }
      // Remove from local state after successful deletion
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setConfirmOpen(false)
    } catch (err) {
      console.error('Error deleting product', err)
      window.alert('Error deleting product')
      setConfirmOpen(false)
    }
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
            <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
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
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(v) => {
          setConfirmOpen(v)
          if (!v) setPendingDelete(null)
        }}
        title="Delete product"
        description={pendingDelete && pendingDelete.name ? `Delete '${pendingDelete.name}'? This action cannot be undone.` : "Are you sure you want to delete this product? This action cannot be undone."}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={async () => {
          if (!pendingDelete) return
          await performDeleteProduct(pendingDelete.id)
        }}
      />
    </div>
  )
}
