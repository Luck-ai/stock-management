"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"

// Mock product data
const mockProducts = [
  {
    id: "1",
    name: "Wireless Headphones",
    sku: "WH-001",
    category: "Electronics",
    price: 99.99,
    stock: 45,
    status: "In Stock",
    image: "/wireless-headphones.png",
    description: "High-quality wireless headphones with noise cancellation",
    totalSales: 1250,
    monthlyGrowth: 12.5,
  },
  {
    id: "2",
    name: "Gaming Mouse",
    sku: "GM-002",
    category: "Electronics",
    price: 79.99,
    stock: 8,
    status: "Low Stock",
    image: "/gaming-mouse.png",
    description: "Precision gaming mouse with RGB lighting",
    totalSales: 890,
    monthlyGrowth: 8.3,
  },
  {
    id: "3",
    name: "Office Chair",
    sku: "OC-003",
    category: "Furniture",
    price: 299.99,
    stock: 0,
    status: "Out of Stock",
    image: "/ergonomic-office-chair.png",
    description: "Ergonomic office chair with lumbar support",
    totalSales: 456,
    monthlyGrowth: -2.1,
  },
  {
    id: "4",
    name: "Desk Lamp",
    sku: "DL-004",
    category: "Furniture",
    price: 49.99,
    stock: 23,
    status: "In Stock",
    image: "/modern-desk-lamp.png",
    description: "LED desk lamp with adjustable brightness",
    totalSales: 678,
    monthlyGrowth: 15.7,
  },
  {
    id: "5",
    name: "Bluetooth Speaker",
    sku: "BS-005",
    category: "Electronics",
    price: 129.99,
    stock: 67,
    status: "In Stock",
    image: "/bluetooth-speaker.png",
    description: "Portable Bluetooth speaker with premium sound",
    totalSales: 2100,
    monthlyGrowth: 22.4,
  },
  {
    id: "6",
    name: "Standing Desk",
    sku: "SD-006",
    category: "Furniture",
    price: 599.99,
    stock: 12,
    status: "In Stock",
    image: "/standing-desk-setup.png",
    description: "Height-adjustable standing desk",
    totalSales: 234,
    monthlyGrowth: 5.8,
  },
]

export function ProductsListing() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", ...Array.from(new Set(mockProducts.map((p) => p.category)))]

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800"
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800"
      case "Out of Stock":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Stock":
        return <Package className="h-3 w-3" />
      case "Low Stock":
        return <AlertTriangle className="h-3 w-3" />
      case "Out of Stock":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(product.status)}>
                  {getStatusIcon(product.status)}
                  <span className="ml-1">{product.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">${product.price}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{product.stock} units</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{product.totalSales} sales</span>
                  <Badge variant={product.monthlyGrowth > 0 ? "default" : "destructive"}>
                    {product.monthlyGrowth > 0 ? "+" : ""}
                    {product.monthlyGrowth}%
                  </Badge>
                </div>
                <Link href={`/dashboard/products/${product.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms or category filter</p>
        </div>
      )}
    </div>
  )
}
