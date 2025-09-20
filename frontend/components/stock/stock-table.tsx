"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, AlertTriangle, Eye, Grid, List, Filter, Package, DollarSign } from "lucide-react"
import { apiFetch } from '@/lib/api'
import type { Product } from "./stock-management"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { getStockStatus } from "@/lib/stock-utils"

export function StockTable({ products, onEdit, onDelete, categories }: { products?: Product[]; onEdit?: (p: Product) => void; onDelete?: (id: string) => void; categories?: string[] }) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name?: string } | null>(null)
  const [confirmProductError, setConfirmProductError] = useState<string | null>(null)

  const formatDateOnly = (val?: string) => {
    if (!val) return ''
    try { const d = new Date(val); if (isNaN(d.getTime())) return String(val); return d.toLocaleDateString() } catch { return String(val) }
  }

  useEffect(() => {
    let active = true
    if (products !== undefined) {
      setFetchedProducts(null)
      setLoading(false)
      setError(null)
      return
    }

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch('/products/')
        if (!active) return
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to fetch products: ${res.status} ${text}`)
        }
        const data = await res.json()
        if (!active) return
        const mod = await import('@/lib/response-mappers')
        const mapped: Product[] = Array.isArray(data) ? data.map((p: any) => mod.normalizeProduct(p)) : []
        if (active) setFetchedProducts(mapped)
      } catch (err: any) {
        if (active) setError(err.message || String(err))
      } finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [products])

  useEffect(() => {
    let active = true
    const handler = async (e: any) => {
      try {
        const url: string = e?.detail?.url
        if (url && url.includes('/products')) {
          setFetchedProducts(null)
          setLoading(true)
          setError(null)
          try {
            const res = await apiFetch('/products/')
            if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`)
            const data = await res.json()
            const mod = await import('@/lib/response-mappers')
            const mapped: Product[] = Array.isArray(data) ? data.map((p: any) => mod.normalizeProduct(p)) : []
            if (active) setFetchedProducts(mapped)
          } catch (err: any) {
            if (active) setError(err.message || String(err))
          } finally { if (active) setLoading(false) }
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener('csv:uploaded', handler)
    return () => { active = false; window.removeEventListener('csv:uploaded', handler) }
  }, [])

  async function performDelete(id: string) {
    try {
      const res = await apiFetch(`/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setFetchedProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev))
      setConfirmOpen(false)
    } catch (err: any) {
      setConfirmProductError(String(err?.message ?? err))
      throw err
    }
  }

  const sourceProducts = products && products.length ? products : fetchedProducts ?? []
  const categoryOptions = (categories && categories.length ? categories : Array.from(new Set(sourceProducts.map((p) => p.category).filter(Boolean)))) || []
  const displayedProducts = selectedCategory && selectedCategory !== 'All' ? sourceProducts.filter((p) => p.category === selectedCategory) : sourceProducts

  if (loading) return <div className="rounded-md border p-4">Loading products...</div>
  if (error) return <div className="rounded-md border p-4 text-destructive">Error: {error}</div>

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock": return "bg-green-100 text-green-800"
      case "Low Stock": return "bg-yellow-100 text-yellow-800"
      case "Out of Stock": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Stock": return <Package className="h-3 w-3" />
      case "Low Stock": return <AlertTriangle className="h-3 w-3" />
      case "Out of Stock": return <AlertTriangle className="h-3 w-3" />
      default: return <Package className="h-3 w-3" />
    }
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-4">
        <div className="text-sm font-medium">Inventory</div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter</span>
            <Select defaultValue={selectedCategory} onValueChange={(v) => setSelectedCategory(v)}>
              <SelectTrigger size="sm">
                <SelectValue>{selectedCategory}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
            <List className="mr-2 h-4 w-4" /> List
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
            <Grid className="mr-2 h-4 w-4" /> Grid
          </Button>
          <label className="inline-block">
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              id="sales-csv-input"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                try {
                  const form = new FormData()
                  form.append('file', f)
                  const res = await apiFetch('/sales/upload', { method: 'POST', body: form })
                  if (!res.ok) {
                    const txt = await res.text().catch(() => '')
                    throw new Error(txt || `Upload failed: ${res.status}`)
                  }
                  const data = await res.json()
                  window.dispatchEvent(new CustomEvent('csv:uploaded', { detail: { url: '/sales/upload', result: data } }))
                  alert(data?.message || 'Upload complete')
                } catch (err: any) {
                  console.error('CSV upload error', err)
                  alert('CSV upload failed: ' + (err?.message ?? String(err)))
                } finally { (e.target as HTMLInputElement).value = '' }
              }}
            />
            <Button size="sm">Upload Sales CSV</Button>
          </label>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProducts.map((product) => {
              const serverLabel = (product as any).statusLabel as string | undefined
              const serverVariant = (product as any).statusVariant as 'destructive' | 'secondary' | 'default' | undefined
              const serverIsLow = (product as any).isLowStockFlag as boolean | undefined

              const computed = getStockStatus(product.quantity, product.lowStockThreshold)
              const label = serverLabel ?? computed.label
              const variant = serverVariant ?? computed.variant
              const isLowStockFlagForUI = typeof serverIsLow === 'boolean' ? serverIsLow : computed.label === 'Low Stock'
              const isOutOfStockFlagForUI = computed.label === 'Out of Stock'

              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(label)}>
                        {getStatusIcon(label)}
                        <span className="ml-1">{label}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">${Number(product.price).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{product.quantity} units</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{product.category || 'Uncategorized'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => onEdit && onEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setPendingDelete({ id: product.id, name: product.name }); setConfirmOpen(true) }}>
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
              )
            })}
          </div>
          {displayedProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={(v) => { setConfirmOpen(v); if (!v) { setPendingDelete(null); setConfirmProductError(null) } }}
            title="Delete product"
            description={pendingDelete && pendingDelete.name ? `Delete '${pendingDelete.name}'? This action cannot be undone.` : "Are you sure you want to delete this product? This action cannot be undone."}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            error={confirmProductError}
            onConfirm={async () => { if (!pendingDelete) return; await performDelete(pendingDelete.id) }}
          />
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="border-b-2" style={{ borderColor: 'var(--ui-table-header-border)' }}>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Low Threshold</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-sm text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {displayedProducts.map((product) => {
                    const serverLabel = (product as any).statusLabel as string | undefined
                    const serverVariant = (product as any).statusVariant as string | undefined
                    const serverIsLow = (product as any).isLowStockFlag as boolean | undefined

                    const computed = getStockStatus(product.quantity, product.lowStockThreshold)
                    const label = serverLabel ?? computed.label
                    const variant = (serverVariant as 'destructive' | 'secondary' | 'default') ?? computed.variant
                    const isLowStockFlagForUI = typeof serverIsLow === 'boolean' ? serverIsLow : computed.label === 'Low Stock'
                    const isOutOfStockFlagForUI = computed.label === 'Out of Stock'

                    return (
                      <TableRow key={product.id} style={{ backgroundColor: 'var(--ui-table-row-bg)', borderTop: '2px solid var(--ui-table-row-border)' }}>
                        <TableCell className="w-12 py-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" className="accent-purple-600" />
                            {/* compact placeholder removed to simplify layout */}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className={isOutOfStockFlagForUI ? 'text-red-700 font-semibold' : isLowStockFlagForUI ? 'text-yellow-700 font-semibold' : ''}>{product.quantity}</span>
                            {(() => {
                              if (typeof serverIsLow === 'boolean') return serverIsLow
                              const computedForIcon = getStockStatus(product.quantity, product.lowStockThreshold)
                              return computedForIcon.label !== 'In Stock'
                            })() && (
                              <AlertTriangle className={isOutOfStockFlagForUI ? 'h-4 w-4 text-red-600' : isLowStockFlagForUI ? 'h-4 w-4 text-yellow-600' : 'h-4 w-4 text-destructive'} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{product.lowStockThreshold}</TableCell>
                        <TableCell>{Number(product.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={variant as any}>{label}</Badge>
                        </TableCell>
                        <TableCell>{product.supplier}</TableCell>
                        <TableCell>{formatDateOnly(product.lastUpdated)}</TableCell>
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
                            <Button variant="ghost" size="sm" onClick={() => { setPendingDelete({ id: product.id, name: product.name }); setConfirmOpen(true) }}>
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
