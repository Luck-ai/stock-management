"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, AlertTriangle, Eye, Grid, List } from "lucide-react"
import { apiFetch } from '@/lib/api'
import type { Product } from "./stock-management"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface StockTableProps {
  products?: Product[]
  onEdit?: (product: Product) => void
  onDelete?: (id: string) => void
}

export function StockTable({ products, onEdit, onDelete }: StockTableProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const getStockStatus = (quantity: number, threshold: number) => {
  
    if (!threshold || threshold <= 0) {
      if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
      return { label: "In Stock", variant: "default" as const }
    }

    const margin = Math.ceil(threshold * 0.2)

    // Treat zero as out of stock, then check for low stock margin before generic below-threshold case
    // TODO Fix this
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (quantity < threshold) return { label: "Out of Stock", variant: "destructive" as const }
    if (Math.abs(threshold - quantity) <= margin) return { label: "Low Stock", variant: "secondary" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (id: string, name?: string) => {
    
    if (onDelete) {
      onDelete(id)
      return
    }

    setPendingDelete({ id, name })
    setConfirmOpen(true)
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name?: string } | null>(null)

  async function performDelete(id: string) {
    try {
      const url = `/products/${id}`

      const res = await apiFetch(url, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error('Failed to delete product', { status: res.status, body: text })
        window.alert('Failed to delete product')
        setConfirmOpen(false)
        return
      }
      
      setFetchedProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev))
      setConfirmOpen(false)
    } catch (err) {
      console.error('Error deleting product', err)
      window.alert('Error deleting product')
      setConfirmOpen(false)
    }
  }

  useEffect(() => {
    let mounted = true
    // If parent supplied products, don't fetch
    if (products && products.length) return
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
  const res = await apiFetch('/products/')
        if (!mounted) return
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to fetch products: ${res.status} ${text}`)
        }
        const data = await res.json()
  // Raw response received from /products/
        if (!mounted) return
        const mapped: Product[] = Array.isArray(data)
          ? data.map((p: any) => ({
              id: String(p.id ?? ""),
              name: p.name ?? "",
              sku: p.sku ?? "",
              category: p.category?.name ?? p.category ?? "",
              description: p.description ?? "",
              quantity: Number(p.quantity ?? 0),
              price: Number(p.price ?? 0),
              
              lowStockThreshold: Number(p.low_stock_threshold ?? 0),
              
              statusLabel: p.status ?? p.quantity_warning_label ?? undefined,
              statusVariant: p.quantity_warning_variant ?? undefined,
              isLowStockFlag: typeof p.is_low_stock === 'boolean' ? p.is_low_stock : undefined,
              supplier: p.supplier?.name ?? p.supplier ?? "",
              lastUpdated: p.last_updated ?? p.lastUpdated ?? "",
            }))
          : []
        setFetchedProducts(mapped)
  // Mapped products ready for UI
      } catch (err: any) {
        console.error(err)
        if (mounted) setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [products])

  const sourceProducts = products && products.length ? products : fetchedProducts ?? []

  if (loading) return <div className="rounded-md border p-4">Loading products...</div>
  if (error) return <div className="rounded-md border p-4 text-destructive">Error: {error}</div>

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-4">
        <div className="text-sm font-medium">Inventory</div>
        <div className="flex items-center space-x-2">
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
            <List className="mr-2 h-4 w-4" /> List
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
            <Grid className="mr-2 h-4 w-4" /> Grid
          </Button>
        </div>
      </div>
      {viewMode === 'grid' ? (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sourceProducts.map((product) => (
              <Card key={product.id} className="border rounded-md hover:shadow-lg transition-shadow" style={{ borderColor: '#7a67ce' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                        {product.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                    <Badge variant={product.quantity === 0 ? 'destructive' : product.quantity <= product.lowStockThreshold ? 'secondary' : 'default'}>
                      {product.quantity === 0 ? 'Out of Stock' : product.quantity <= product.lowStockThreshold ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#e8e6f9]">
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">${Number(product.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{product.quantity} units</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{product.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => onEdit && onEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id, product.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {sourceProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      ) : (
        <>
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
          await performDelete(pendingDelete.id)
        }}
      />
        <Table>
        <TableHeader className="bg-transparent">
          <TableRow className="border-b-2" style={{ borderColor: '#7a67ce' }}>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sourceProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-sm text-muted-foreground">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            <>
              {sourceProducts.map((product) => {
                // Determine status label/variant using server-provided values when available.
                const serverLabel = (product as any).statusLabel as string | undefined
                const serverVariant = (product as any).statusVariant as string | undefined
                const serverIsLow = (product as any).isLowStockFlag as boolean | undefined

                const computed = getStockStatus(product.quantity, product.lowStockThreshold)
                const label = serverLabel ?? computed.label
                // Accept serverVariant values that match our Badge variants; fallback to computed mapping.
                const variant = (serverVariant as 'destructive' | 'secondary' | 'default') ?? computed.variant
                return (
                  <TableRow key={product.id} className="bg-[#e8e6f9]" style={{ borderTop: '2px solid #aaa3d2' }}>
                    <TableCell className="w-12 py-4">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="accent-purple-600" />
                        <div className="w-8 h-6 bg-white rounded-sm flex items-center justify-center text-xs font-medium text-muted-foreground border" style={{ borderColor: '#7a67ce' }}>
                          {product.name ? product.name.slice(0, 1).toUpperCase() : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{product.quantity}</span>
                        {/* Show warning icon if server explicitly marks low stock/out-of-stock, else use computed status */}
                        {(() => {
                          // If server explicitly set a boolean flag, respect it
                          if (typeof serverIsLow === 'boolean') return serverIsLow
                          // Otherwise use computed status
                          const computedForIcon = getStockStatus(product.quantity, product.lowStockThreshold)
                          return computedForIcon.label !== 'In Stock'
                        })() && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={variant as any}>{label}</Badge>
                    </TableCell>
                    <TableCell>{product.supplier}</TableCell>
                    <TableCell>{product.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/products/${product.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEdit && onEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id, product.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </>
          )}
        </TableBody>
        </Table>
        </>
      )}
    </div>
  )
}
