"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, AlertTriangle, Eye } from "lucide-react"
import type { Product } from "./stock-management"

interface StockTableProps {
  products?: Product[]
  onEdit?: (product: Product) => void
  onDelete?: (id: string) => void
}

export function StockTable({ products, onEdit, onDelete }: StockTableProps) {
  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (quantity <= threshold) return { label: "Low Stock", variant: "secondary" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    // If parent supplied products, don't fetch
    if (products && products.length) return
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("http://localhost:8000/products/")
        if (!mounted) return
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to fetch products: ${res.status} ${text}`)
        }
        const data = await res.json()
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
              lowStockThreshold: Number(p.low_stock_threshold ?? p.lowStockThreshold ?? 0),
              supplier: p.supplier?.name ?? p.supplier ?? "",
              lastUpdated: p.last_updated ?? p.lastUpdated ?? "",
            }))
          : []
        setFetchedProducts(mapped)
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
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            <>
              {sourceProducts.map((product) => {
                const status = getStockStatus(product.quantity, product.lowStockThreshold)
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{product.quantity}</span>
                        {product.quantity <= product.lowStockThreshold && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
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
                        <Button variant="ghost" size="sm" onClick={() => onDelete && onDelete(product.id)}>
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
    </div>
  )
}
