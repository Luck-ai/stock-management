"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StockTable } from "./stock-table"
import { AddProductDialog } from "./add-product-dialog"
import { EditProductDialog } from "./edit-product-dialog"
import { Plus, Search, Loader2 } from "lucide-react"
import { useProducts } from "@/lib/hooks/use-api"
import { useApiMutation } from "@/lib/hooks/use-api"
import { apiClient, handleApiError } from "@/lib/api"
import type { Product, CreateProductRequest } from "@/lib/api"

export function StockManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const {
    data: productsData,
    loading,
    error,
    refetch,
  } = useProducts({
    search: searchTerm || undefined,
    limit: 100,
  })

  const {
    mutate: createProduct,
    loading: creating,
    error: createError,
  } = useApiMutation<Product, CreateProductRequest>()
  const {
    mutate: updateProduct,
    loading: updating,
    error: updateError,
  } = useApiMutation<Product, { id: number; data: Partial<CreateProductRequest> }>()
  const { mutate: deleteProduct, loading: deleting, error: deleteError } = useApiMutation<void, number>()

  const products = productsData?.items || []
  const lowStockCount = products.filter((product) => product.stock_quantity <= product.min_stock_level).length
  const totalProducts = productsData?.total || 0
  const totalValue = products.reduce((sum, product) => sum + product.stock_quantity * product.price, 0)

  const handleAddProduct = async (newProductData: CreateProductRequest) => {
    const result = await createProduct((data) => apiClient.createProduct(data), newProductData)

    if (result) {
      await refetch()
      setIsAddDialogOpen(false)
    }
  }

  const handleEditProduct = async (updatedProduct: Product) => {
    const result = await updateProduct(({ id, data }) => apiClient.updateProduct(id, data), {
      id: updatedProduct.id,
      data: {
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        description: updatedProduct.description,
        category: updatedProduct.category,
        price: updatedProduct.price,
        cost: updatedProduct.cost,
        stock_quantity: updatedProduct.stock_quantity,
        min_stock_level: updatedProduct.min_stock_level,
        max_stock_level: updatedProduct.max_stock_level,
        supplier_id: updatedProduct.supplier_id,
      },
    })

    if (result) {
      await refetch()
      setEditingProduct(null)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    const result = await deleteProduct((productId) => apiClient.deleteProduct(productId), id)

    if (result !== null) {
      await refetch()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground">Manage your inventory and track stock levels</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} disabled={creating}>
          {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Add Product
        </Button>
      </div>

      {(error || createError || updateError || deleteError) && (
        <Alert variant="destructive">
          <AlertDescription>{handleApiError(error || createError || updateError || deleteError)}</AlertDescription>
        </Alert>
      )}

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

          <StockTable
            products={products}
            onEdit={setEditingProduct}
            onDelete={handleDeleteProduct}
            loading={deleting}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddProduct}
        loading={creating}
      />

      {editingProduct && (
        <EditProductDialog
          open={!!editingProduct}
          onOpenChange={() => setEditingProduct(null)}
          product={editingProduct}
          onEdit={handleEditProduct}
          loading={updating}
        />
      )}
    </div>
  )
}
