"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, TrendingUp, Package, ShoppingCart, Loader2 } from "lucide-react"
import { useRestockSuggestions, useApiMutation } from "@/lib/hooks/use-api"
import { apiClient, handleApiError } from "@/lib/api"

export function AutoReorderSuggestions() {
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const { data: suggestions, loading, error, refetch } = useRestockSuggestions()
  const { mutate: createPurchaseOrder, loading: creating, error: createError } = useApiMutation()

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked && suggestions) {
      setSelectedItems(suggestions.map((s) => s.product.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id])
    } else {
      setSelectedItems(selectedItems.filter((item) => item !== id))
      setSelectAll(false)
    }
  }

  const handleCreatePurchaseOrders = async () => {
    if (!suggestions || selectedItems.length === 0) return

    const selectedSuggestions = suggestions.filter((s) => selectedItems.includes(s.product.id))

    // Group by supplier
    const ordersBySupplier = selectedSuggestions.reduce(
      (acc, suggestion) => {
        const supplierId = suggestion.product.supplier_id || 1 // Default supplier if none
        if (!acc[supplierId]) {
          acc[supplierId] = []
        }
        acc[supplierId].push({
          product_id: suggestion.product.id,
          quantity: suggestion.suggested_quantity,
          unit_cost: suggestion.product.cost,
        })
        return acc
      },
      {} as Record<number, Array<{ product_id: number; quantity: number; unit_cost: number }>>,
    )

    // Create purchase orders for each supplier
    for (const [supplierId, items] of Object.entries(ordersBySupplier)) {
      const orderData = {
        supplier_id: Number(supplierId),
        items,
        expected_delivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 14 days from now
      }

      await createPurchaseOrder((data) => apiClient.createPurchaseOrder(data), orderData)
    }

    if (!createError) {
      setSelectedItems([])
      setSelectAll(false)
      await refetch()
    }
  }

  const getPriorityBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="secondary">Medium</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="default">Normal</Badge>
    }
  }

  const getReasonIcon = (daysUntilStockout: number) => {
    if (daysUntilStockout <= 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    } else if (daysUntilStockout <= 7) {
      return <Package className="h-4 w-4 text-yellow-500" />
    } else {
      return <TrendingUp className="h-4 w-4 text-blue-500" />
    }
  }

  const selectedTotal =
    suggestions
      ?.filter((s) => selectedItems.includes(s.product.id))
      .reduce((sum, s) => sum + s.suggested_quantity * s.product.cost, 0) || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{handleApiError(error)}</AlertDescription>
      </Alert>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Restock Suggestions</h3>
            <p className="text-muted-foreground">All products are currently well-stocked.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Reorder Suggestions</CardTitle>
          <CardDescription>
            AI-powered recommendations based on stock levels, sales trends, and lead times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
              <span className="text-sm">Select All ({suggestions.length} items)</span>
              {selectedItems.length > 0 && <Badge variant="outline">{selectedItems.length} selected</Badge>}
            </div>
            <div className="flex items-center space-x-2">
              {selectedItems.length > 0 && (
                <span className="text-sm text-muted-foreground">Total: ${selectedTotal.toLocaleString()}</span>
              )}
              <Button disabled={selectedItems.length === 0 || creating} onClick={handleCreatePurchaseOrders}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Purchase Orders
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert for Purchase Order Creation */}
      {createError && (
        <Alert variant="destructive">
          <AlertDescription>{handleApiError(createError)}</AlertDescription>
        </Alert>
      )}

      {/* Suggestions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Suggested Qty</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Days Until Stockout</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion) => (
                <TableRow key={suggestion.product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(suggestion.product.id)}
                      onCheckedChange={(checked) => handleSelectItem(suggestion.product.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getReasonIcon(suggestion.days_until_stockout)}
                      <div>
                        <p className="font-medium">{suggestion.product.name}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.product.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span
                        className={
                          suggestion.product.stock_quantity === 0
                            ? "text-red-600 font-bold"
                            : suggestion.product.stock_quantity <= suggestion.product.min_stock_level
                              ? "text-yellow-600 font-medium"
                              : ""
                        }
                      >
                        {suggestion.product.stock_quantity}
                      </span>
                      <p className="text-xs text-muted-foreground">/ {suggestion.product.min_stock_level}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{suggestion.suggested_quantity}</TableCell>
                  <TableCell>{suggestion.product.supplier_name || "Default Supplier"}</TableCell>
                  <TableCell>${suggestion.product.cost.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">
                    ${(suggestion.suggested_quantity * suggestion.product.cost).toLocaleString()}
                  </TableCell>
                  <TableCell>{getPriorityBadge(suggestion.urgency)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        suggestion.days_until_stockout <= 0
                          ? "text-red-600 font-bold"
                          : suggestion.days_until_stockout <= 7
                            ? "text-yellow-600 font-medium"
                            : ""
                      }
                    >
                      {suggestion.days_until_stockout <= 0 ? "Out of stock" : `${suggestion.days_until_stockout} days`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" disabled={creating}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        disabled={creating}
                        onClick={() => {
                          setSelectedItems([suggestion.product.id])
                          handleCreatePurchaseOrders()
                        }}
                      >
                        Order
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
