"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CalendarDays, TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle, Users } from "lucide-react"
import { InventoryOverview } from "./inventory-overview"
import { SalesAnalytics } from "./sales-analytics"
import { CategoryPerformance } from "./category-performance"
import { SupplierAnalytics } from "./supplier-analytics"
import { getRestockSummary, RestockSummary, getSales, getProducts, filterByTimeRange } from "@/lib/api"
import { getStockCounts } from '@/lib/stock-utils'

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restockSummary, setRestockSummary] = useState<RestockSummary | null>(null)
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null)
  const [totalOrders, setTotalOrders] = useState<number | null>(null)
  const [averageOrderValue, setAverageOrderValue] = useState<number | null>(null)
  const [inventoryValue, setInventoryValue] = useState<number | null>(null)
  const [computedLowStock, setComputedLowStock] = useState<number | null>(null)
  const [computedOutOfStock, setComputedOutOfStock] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const [summary, salesRaw, products] = await Promise.all([getRestockSummary(), getSales(), getProducts()])

        if (!mounted) return

  setRestockSummary(summary)

        // Filter sales according to selected time range (sale_date field)
        const sales = filterByTimeRange(salesRaw || [], timeRange, 'sale_date')

        // Compute sales KPIs (sale_price assumed to be in dollars; if cents, divide by 100)
        const totalRev = sales.reduce((sum: number, s: any) => sum + ((s.sale_price ?? 0) * (s.quantity ?? 0)), 0)

        // totalUnitsSold = sum of quantities
        const totalUnitsSold = sales.reduce((sum: number, s: any) => sum + (s.quantity ?? 0), 0)

        // totalOrders: best-effort count of distinct order identifiers if present, otherwise number of sale records
        const orderIdSet = new Set(sales.map((s: any) => s.order_id).filter((id: any) => id !== undefined && id !== null))
        const totalOrdersCount = orderIdSet.size > 0 ? orderIdSet.size : sales.length

        const aov = totalOrdersCount > 0 ? totalRev / totalOrdersCount : 0

        setTotalRevenue(Math.round(totalRev))
        setTotalOrders(totalUnitsSold)
        setAverageOrderValue(Math.round(aov * 100) / 100)

  // Inventory value: use same calculation as stock-management (price * quantity)
  // Note: normalizeProduct sets `price` directly from API; keep calculation consistent across components
  const invValue = products.reduce((sum: number, p: any) => sum + (p.price) * p.quantity, 0)
        setInventoryValue(Math.round(invValue))

        // Use centralized stock-utils to compute low/out of stock counts from fetched products
        try {
          const counts = getStockCounts(products || [])
          setComputedLowStock(counts.lowStock)
          setComputedOutOfStock(counts.outOfStock)
          // update restockSummary-like counts locally if API summary missing
          if (!summary) {
            setRestockSummary({ low_stock_items: counts.lowStock, out_of_stock_items: counts.outOfStock } as RestockSummary)
          }
        } catch (err) {
          // non-fatal: leave restockSummary as provided by API
          console.warn('Failed to compute stock counts from products:', err)
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const kpis = {
    totalRevenue: loading ? '—' : totalRevenue ?? '—',
    revenueChange: 0,
    totalOrders: loading ? '—' : totalOrders ?? '—',
    ordersChange: 0,
    averageOrderValue: loading ? '—' : averageOrderValue ?? '—',
    aovChange: 0,
    inventoryValue: loading ? '—' : inventoryValue ?? '—',
    inventoryChange: 0,
    lowStockItems: computedLowStock !== null ? computedLowStock : (restockSummary ? restockSummary.low_stock_items : '—'),
    outOfStockItems: computedOutOfStock !== null ? computedOutOfStock : (restockSummary ? restockSummary.out_of_stock_items : '—'),
    topSellingCategory: '—',
    worstPerformingCategory: '—',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into your inventory performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <CalendarDays className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+{kpis.revenueChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              {kpis.ordersChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+{kpis.aovChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.inventoryValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+{kpis.inventoryChange}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{computedLowStock !== null ? computedLowStock : (restockSummary ? restockSummary.low_stock_items : '—')}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{computedOutOfStock !== null ? computedOutOfStock : (restockSummary ? restockSummary.out_of_stock_items : '—')}</div>
            <p className="text-xs text-muted-foreground">Items with zero inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.topSellingCategory}</div>
            <p className="text-xs text-muted-foreground">Best performing category</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InventoryOverview timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <SalesAnalytics timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryPerformance timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <SupplierAnalytics timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
