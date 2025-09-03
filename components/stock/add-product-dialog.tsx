"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useSuppliers } from "@/lib/hooks/use-api"
import type { CreateProductRequest } from "@/lib/api"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (product: CreateProductRequest) => void
  loading?: boolean
}

const categories = [
  "Electronics",
  "Accessories",
  "Clothing",
  "Books",
  "Home & Garden",
  "Office Supplies",
  "Sports",
  "Health & Beauty",
]

export function AddProductDialog({ open, onOpenChange, onAdd, loading = false }: AddProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    price: "",
    cost: "",
    stock_quantity: "",
    min_stock_level: "",
    max_stock_level: "",
    supplier_id: "",
  })

  const { data: suppliers } = useSuppliers()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const productData: CreateProductRequest = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description || undefined,
      category: formData.category,
      price: Number.parseFloat(formData.price),
      cost: Number.parseFloat(formData.cost),
      stock_quantity: Number.parseInt(formData.stock_quantity),
      min_stock_level: Number.parseInt(formData.min_stock_level),
      max_stock_level: Number.parseInt(formData.max_stock_level),
      supplier_id: formData.supplier_id ? Number.parseInt(formData.supplier_id) : undefined,
    }

    onAdd(productData)

    // Reset form
    setFormData({
      name: "",
      sku: "",
      description: "",
      category: "",
      price: "",
      cost: "",
      stock_quantity: "",
      min_stock_level: "",
      max_stock_level: "",
      supplier_id: "",
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory. Fill in all the required information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU *
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right col-span-2">
                  Price *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  className="col-span-2"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right col-span-2">
                  Cost *
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleChange("cost", e.target.value)}
                  className="col-span-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock_quantity" className="text-right">
                Stock Qty *
              </Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleChange("stock_quantity", e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="min_stock" className="text-right col-span-2">
                  Min Stock *
                </Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => handleChange("min_stock_level", e.target.value)}
                  className="col-span-2"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max_stock" className="text-right col-span-2">
                  Max Stock *
                </Label>
                <Input
                  id="max_stock"
                  type="number"
                  min="0"
                  value={formData.max_stock_level}
                  onChange={(e) => handleChange("max_stock_level", e.target.value)}
                  className="col-span-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">
                Supplier
              </Label>
              <Select value={formData.supplier_id} onValueChange={(value) => handleChange("supplier_id", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
