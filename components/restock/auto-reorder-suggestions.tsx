"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, TrendingUp, Package, ShoppingCart } from "lucide-react"

interface ReorderSuggestion {
  id: string
  product: string
  sku: string
  currentStock: number
  threshold: number
  suggestedQuantity: number
  supplier: string
  unitCost: number
  totalCost: number
  priority: "critical" | "high" | "medium"
  reason: string
  leadTime: number
}

// Mock reorder suggestions
const suggestions: ReorderSuggestion[] = [
  {
    id: "1",
    product: "Bluetooth Speaker",
    sku: "BS-002",
    currentStock: 8,
    threshold: 15,
    suggestedQuantity: 50,
    supplier: "AudioMax",
    unitCost: 45.99,
    totalCost: 2299.5,
    priority: "high",
    reason: "Below threshold",
    leadTime: 7,
  },
  {
    id: "2",
    product: "Gaming Keyboard",
    sku: "GK-006",
    currentStock: 0,
    threshold: 10,
    suggestedQuantity: 30,
    supplier: "TechCorp",
    unitCost: 89.99,
    totalCost: 2699.7,
    priority: "critical",
    reason: "Out of stock",
    leadTime: 5,
  },
  {
    id: "3",
    product: "Laptop Stand",
    sku: "LS-004",
    currentStock: 3,
    threshold: 5,
    suggestedQuantity: 25,
    supplier: "DeskPro",
    unitCost: 35.99,
    totalCost: 899.75,
    priority: "high",
    reason: "Below threshold",
    leadTime: 10,
  },
  {
    id: "4",
    product: "Wireless Charger",
    sku: "WC-007",
    currentStock: 12,
    threshold: 20,
    suggestedQuantity: 40,
    supplier: "TechCorp",
    unitCost: 24.99,
    totalCost: 999.6,
    priority: "medium",
    reason: "Trending up",
    leadTime: 7,
  },
  {
    id: "5",
    product: "USB Hub",
    sku: "UH-008",
    currentStock: 0,
    threshold: 15,
    suggestedQuantity: 35,
    supplier: "CableCo",
    unitCost: 19.99,
    totalCost: 699.65,
    priority: "critical",
    reason: "Out of stock",
    leadTime: 14,
  },
]

export function AutoReorderSuggestions() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedItems(suggestions.map((s) => s.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id])
    } else {
      setSelectedItems(selectedItems.filter((item) => item !== id))
      setSelectAll(false)
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "high":
        return <Badge variant="secondary">High</Badge>
      case "medium":
        return <Badge variant="outline">Medium</Badge>
      default:
        return <Badge variant="default">Low</Badge>
    }
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "Out of stock":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "Below threshold":
        return <Package className="h-4 w-4 text-yellow-500" />
      case "Trending up":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const selectedTotal = suggestions.filter((s) => selectedItems.includes(s.id)).reduce((sum, s) => sum + s.totalCost, 0)

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
              <Button disabled={selectedItems.length === 0}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Purchase Orders
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <TableHead>Lead Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(suggestion.id)}
                      onCheckedChange={(checked) => handleSelectItem(suggestion.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getReasonIcon(suggestion.reason)}
                      <div>
                        <p className="font-medium">{suggestion.product}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span
                        className={
                          suggestion.currentStock === 0
                            ? "text-red-600 font-bold"
                            : suggestion.currentStock <= suggestion.threshold
                              ? "text-yellow-600 font-medium"
                              : ""
                        }
                      >
                        {suggestion.currentStock}
                      </span>
                      <p className="text-xs text-muted-foreground">/ {suggestion.threshold}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{suggestion.suggestedQuantity}</TableCell>
                  <TableCell>{suggestion.supplier}</TableCell>
                  <TableCell>${suggestion.unitCost}</TableCell>
                  <TableCell className="font-medium">${suggestion.totalCost.toLocaleString()}</TableCell>
                  <TableCell>{getPriorityBadge(suggestion.priority)}</TableCell>
                  <TableCell>{suggestion.leadTime} days</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm">Order</Button>
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
