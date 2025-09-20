"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, AlertCircle, Package, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { getPurchaseOrders, updatePurchaseOrder, ratePurchaseOrder, type PurchaseOrder } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppToast } from "@/lib/use-toast"
import { Switch } from "@/components/ui/switch"

export function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [ratingTargetOrder, setRatingTargetOrder] = useState<PurchaseOrder | null>(null)
  const [onTimeDelivery, setOnTimeDelivery] = useState<number | undefined>(undefined)
  const [qualityScore, setQualityScore] = useState<number | undefined>(undefined)
  const [costEfficiency, setCostEfficiency] = useState<number | undefined>(undefined)
  const [overallRating, setOverallRating] = useState<number | undefined>(undefined)
  const { push } = useAppToast()

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const filterStatus = statusFilter === "all" ? undefined : statusFilter
      const data = await getPurchaseOrders(filterStatus)
      setOrders(data)
    } catch (error) {
      console.error('Failed to load purchase orders:', error)
      push({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await updatePurchaseOrder(orderId, { status: newStatus })
      push({
        title: "Success",
        description: "Order status updated",
        variant: "success",
      })
      // After marking complete, if this is a single-order completion open rating dialog
      if (newStatus === 'completed') {
        const order = orders.find(o => o.id === orderId)
        if (order) {
          setRatingTargetOrder(order)
          // reset rating form
          setOnTimeDelivery(undefined)
          setQualityScore(undefined)
          setCostEfficiency(undefined)
          setOverallRating(undefined)
          setRatingDialogOpen(true)
        }
      }
      loadOrders() // Refresh the list
    } catch (error) {
      console.error('Failed to update order status:', error)
      push({
        title: "Error",
        description: "Failed to update order status",
        variant: "error",
      })
    }
  }

  const handleNotifyToggle = async (orderId: number, checked: boolean) => {
    // Optimistic update locally
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notify_by_email: checked } : o))
    try {
      await updatePurchaseOrder(orderId, { notify_by_email: checked } as any)
      push({ title: "Success", description: "Preference saved", variant: "success" })
    } catch (error) {
      console.error('Failed to update notify preference:', error)
      push({ title: "Error", description: "Failed to save preference", variant: "error" })
      // revert
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notify_by_email: !checked } : o))
    }
  }

  const submitRating = async () => {
    if (!ratingTargetOrder) return
    try {
      setLoading(true)
      await ratePurchaseOrder(ratingTargetOrder.id, {
        on_time_delivery: onTimeDelivery,
        quality_score: qualityScore,
        cost_efficiency: costEfficiency,
        overall_rating: overallRating,
      })
      push({ title: 'Success', description: 'Rating submitted', variant: 'success' })
      setRatingDialogOpen(false)
      setRatingTargetOrder(null)
      loadOrders()
    } catch (err) {
      console.error('Failed to submit rating', err)
      push({ title: 'Error', description: 'Failed to submit rating', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const closeRatingDialog = () => {
    setRatingDialogOpen(false)
    setRatingTargetOrder(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="flex items-center space-x-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
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
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const calculateTotal = (order: PurchaseOrder) => {
    if (order.product) {
      return ((order.product.price / 100) * order.quantity_ordered).toFixed(2)
    }
    return "0.00"
  }

  // Build groups of orders that belong to the same 'batch' (orders created together)
  // We group by exact order_date string when available, otherwise fallback to the order id.
  const buildGroups = (ordersList: PurchaseOrder[]) => {
    if (!ordersList || ordersList.length === 0) return []

    // Prepare items with timestamps
    const items = ordersList.map(o => ({
      order: o,
      ts: o.order_date ? Date.parse(o.order_date) : null
    }))

    // Sort by timestamp (nulls go last) then by id for determinism
    items.sort((a, b) => {
      if (a.ts === b.ts) return a.order.id - b.order.id
      if (a.ts === null) return 1
      if (b.ts === null) return -1
      return a.ts - b.ts
    })

    const groups: Array<Array<PurchaseOrder>> = []
    let currentGroup: Array<PurchaseOrder> = []
    let currentStartTs: number | null = null

    const WINDOW_MS = 2 * 60 * 1000 // 2 minutes

    for (const it of items) {
      if (!currentGroup.length) {
        currentGroup.push(it.order)
        currentStartTs = it.ts
        continue
      }

      // If either timestamp is null, don't group; start a new group
      if (it.ts === null || currentStartTs === null) {
        groups.push(currentGroup)
        currentGroup = [it.order]
        currentStartTs = it.ts
        continue
      }

      // If this order is within WINDOW_MS of the group's start, add it
      if (Math.abs(it.ts - currentStartTs) <= WINDOW_MS) {
        currentGroup.push(it.order)
      } else {
        groups.push(currentGroup)
        currentGroup = [it.order]
        currentStartTs = it.ts
      }
    }

    if (currentGroup.length) groups.push(currentGroup)

    // Map groups to the UI shape
    return groups.map(itemsGroup => {
      const ids = itemsGroup.map(i => i.id)
      const totalQuantity = itemsGroup.reduce((s, i) => s + (i.quantity_ordered || 0), 0)
      const totalValue = itemsGroup.reduce((s, i) => {
        const price = i.product ? (i.product.price / 100) * i.quantity_ordered : 0
        return s + price
      }, 0)
      return {
        key: ids.join(','),
        ids,
        items: itemsGroup,
        totalQuantity,
        totalValue,
        order_date: itemsGroup[0].order_date,
        status: itemsGroup[0].status
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading order history...</span>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Your purchase order history will appear here</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No order history found</p>
          <p className="text-sm">Once you create purchase orders, they will appear here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {/* Rating Dialog */}
              <Dialog open={ratingDialogOpen} onOpenChange={(open) => { if (!open) closeRatingDialog(); else setRatingDialogOpen(open) }}>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Rate Supplier</DialogTitle>
                    <DialogDescription>Provide feedback for the supplier for this completed order</DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 gap-4 py-2">
                    <div>
                      <Label>On-Time Delivery (%)</Label>
                      <Input type="number" min={0} max={100} value={onTimeDelivery ?? ''} onChange={(e) => setOnTimeDelivery(e.target.value === '' ? undefined : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Quality Score (%)</Label>
                      <Input type="number" min={0} max={100} value={qualityScore ?? ''} onChange={(e) => setQualityScore(e.target.value === '' ? undefined : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Cost Efficiency (%)</Label>
                      <Input type="number" min={0} max={100} value={costEfficiency ?? ''} onChange={(e) => setCostEfficiency(e.target.value === '' ? undefined : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Overall Rating</Label>
                      <Select value={String(overallRating ?? '')} onValueChange={(v) => setOverallRating(v === '' ? undefined : Number(v))}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Poor</SelectItem>
                          <SelectItem value="2">2 - Fair</SelectItem>
                          <SelectItem value="3">3 - Good</SelectItem>
                          <SelectItem value="4">4 - Very Good</SelectItem>
                          <SelectItem value="5">5 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="ghost" onClick={closeRatingDialog}>Cancel</Button>
                    <Button onClick={submitRating}>Submit Rating</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <CardTitle>Purchase Order History</CardTitle>
              <CardDescription>View and manage your purchase orders</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadOrders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product(s)</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildGroups(orders).map((group) => (
                <React.Fragment key={group.key}>
                  <TableRow
                    key={group.key}
                    className="cursor-pointer"
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setExpandedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))
                      }
                    }}
                  >
                    <TableCell className="font-medium">#{group.ids[0]}{group.ids.length > 1 ? ` (+${group.ids.length - 1})` : ''}</TableCell>
                    <TableCell>
                      <div>
                        {group.items[0].product ? (
                          <>
                            <Link href={`/dashboard/products/${group.items[0].product.id}`} onClick={(e) => e.stopPropagation()} className="font-medium">
                              {group.items[0].product.name}
                              {group.items.length > 1 ? ` + ${group.items.length - 1} more` : ''}
                            </Link>
                            <p className="text-sm text-muted-foreground">{((group.items[0].product) as any)?.sku}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">Unknown Product{group.items.length > 1 ? ` + ${group.items.length - 1} more` : ''}</p>
                            <p className="text-sm text-muted-foreground">{((group.items[0].product) as any)?.sku}</p>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{group.items[0].supplier?.name || (group.items.length > 1 ? 'Multiple' : 'No Supplier')}</TableCell>
                    <TableCell>{group.totalQuantity}</TableCell>
                    <TableCell>${group.totalValue.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(group.order_date)}</TableCell>
                    <TableCell>{getStatusBadge(group.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm mr-2">Email</span>
                          <Switch
                            onClick={(e) => e.stopPropagation()}
                            checked={!!group.items[0].notify_by_email}
                            onCheckedChange={(v) => {
                              // set for first item in group (persisted per-order)
                              const id = group.items[0].id
                              handleNotifyToggle(id, !!v)
                            }}
                          />
                        </div>
                        {group.status === "pending" && (
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              // mark all orders in the group as completed
                              Promise.all(group.ids.map(id => handleStatusUpdate(id, 'completed')))
                            }}
                          >
                            Mark Complete
                          </Button>
                        )}
                        {group.status === "pending" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              // cancel all orders in the group
                              Promise.all(group.ids.map(id => handleStatusUpdate(id, 'cancelled')))
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        {group.status === 'completed' && (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); setRatingTargetOrder(group.items[0]); setRatingDialogOpen(true) }}>
                            Rate
                          </Button>
                        )}
                        {/* notes icon removed per request */}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedGroups[group.key] && (
                    group.items.map(item => (
                      <TableRow key={`item-${item.id}`} className="bg-muted/50">
                        <TableCell className="pl-8 text-sm">#{item.id}</TableCell>
                        <TableCell className="text-sm">
                          {item.product ? (
                            <Link href={`/dashboard/products/${item.product.id}`} onClick={(e) => e.stopPropagation()}>
                              {item.product.name}
                            </Link>
                          ) : (
                            'Unknown'
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{item.supplier?.name || 'No Supplier'}</TableCell>
                        <TableCell className="text-sm">{item.quantity_ordered}</TableCell>
                        <TableCell className="text-sm">${((item.product?.price ?? 0) / 100 * (item.quantity_ordered ?? 0)).toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{formatDate(item.order_date)}</TableCell>
                        <TableCell className="text-sm">{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center space-x-2">
                            {item.status === 'pending' && (
                                  <>
                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, 'completed') }}>Complete</Button>
                                    <Button size="sm" variant="destructive" className="ml-2" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, 'cancelled') }}>Cancel</Button>
                                    <div className="ml-2 inline-flex items-center">
                                      <span className="text-sm mr-2">Email</span>
                                      <Switch
                                        onClick={(e) => e.stopPropagation()}
                                        checked={!!item.notify_by_email}
                                        onCheckedChange={(v) => handleNotifyToggle(item.id, !!v)}
                                      />
                                    </div>
                                  </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
