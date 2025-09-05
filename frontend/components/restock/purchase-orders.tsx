"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, Edit, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplier: string
  orderDate: string
  expectedDate: string
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  totalItems: number
  totalValue: number
  notes?: string
}

// Mock purchase orders
const purchaseOrders: PurchaseOrder[] = [
  {
    id: "1",
    orderNumber: "PO-2024-001",
    supplier: "TechCorp",
    orderDate: "2024-01-15",
    expectedDate: "2024-01-22",
    status: "shipped",
    totalItems: 3,
    totalValue: 2850.75,
    notes: "Rush order for critical items",
  },
  {
    id: "2",
    orderNumber: "PO-2024-002",
    supplier: "AudioMax",
    orderDate: "2024-01-14",
    expectedDate: "2024-01-21",
    status: "confirmed",
    totalItems: 2,
    totalValue: 1899.5,
  },
  {
    id: "3",
    orderNumber: "PO-2024-003",
    supplier: "CableCo",
    orderDate: "2024-01-13",
    expectedDate: "2024-01-27",
    status: "pending",
    totalItems: 5,
    totalValue: 1245.8,
  },
  {
    id: "4",
    orderNumber: "PO-2024-004",
    supplier: "DeskPro",
    orderDate: "2024-01-10",
    expectedDate: "2024-01-17",
    status: "delivered",
    totalItems: 1,
    totalValue: 899.75,
  },
  {
    id: "5",
    orderNumber: "PO-2024-005",
    supplier: "GlobalSupply",
    orderDate: "2024-01-08",
    expectedDate: "2024-01-15",
    status: "cancelled",
    totalItems: 4,
    totalValue: 1567.2,
    notes: "Cancelled due to supplier issues",
  },
]

export function PurchaseOrders() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")

  const filteredOrders = purchaseOrders.filter((order) => {
    const statusMatch = statusFilter === "all" || order.status === statusFilter
    const supplierMatch = supplierFilter === "all" || order.supplier === supplierFilter
    return statusMatch && supplierMatch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Confirmed</span>
          </Badge>
        )
      case "shipped":
        return (
          <Badge variant="default" className="flex items-center space-x-1">
            <Truck className="h-3 w-3" />
            <span>Shipped</span>
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="default" className="flex items-center space-x-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            <span>Delivered</span>
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const suppliers = Array.from(new Set(purchaseOrders.map((order) => order.supplier)))

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>Track and manage all purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Supplier:</label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.supplier}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>{order.expectedDate}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{order.totalItems} items</TableCell>
                  <TableCell className="font-medium">${order.totalValue.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      {order.status === "pending" && (
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
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
