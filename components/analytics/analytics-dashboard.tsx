"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarDays, TrendingUp, Package, DollarSign, AlertTriangle, Users, Loader2 } from "lucide-react"
import { InventoryOverview } from "./inventory-overview"
import { SalesAnalytics } from "./sales-analytics"
import { CategoryPerformance } from "./category-performance"
import { SupplierAnalytics } from "./supplier-analytics"
import { StockAlerts } from "./stock-alerts"
import { useInventoryStats, useSalesAnalytics, useCategoryPerformance } from "@/lib/hooks/use-api"
import { handleApiError } from "@/lib/api"

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d")

  const { data: inventoryStats, loading: inventoryLoading, error: inventoryError } = useInventoryStats()

  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
  } = useSalesAnalytics({
    start_date: getStartDate(timeRange),
    end_date: new Date().toISOString().split("T")[0],
    group_by: "day",
  })

  const { data: categoryData, loading: categoryLoading, error: categoryError } = useCategoryPerformance()

  const loading = inventoryLoading || salesLoading || categoryLoading
  const error = inventoryError || salesError || categoryError

  // Helper function to get start date based on time range
  function getStartDate(range: string): string {
    const now = new Date()
    switch (range) {
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      case "1y":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    }
  }

  // Calculate derived metrics
  const averageOrderValue = salesData && salesData.total_sales > 0 ? salesData.total_revenue / salesData.total_sales : 0

  const topCategory =
    categoryData && categoryData.length > 0
      ? categoryData.reduce((prev, current) => (prev.total_revenue > current.total_revenue ? prev : current)).category
      : "N/A"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{handleApiError(error)}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData?.total_revenue?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              For selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData?.total_sales?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Sales transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${inventoryStats?.total_value?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Current inventory
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
            <div className="text-2xl font-bold text-yellow-600">{inventoryStats?.low_stock_count || 0}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryStats?.out_of_stock_count || 0}</div>
            <p className="text-xs text-muted-foreground">Items with zero inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topCategory}</div>
            <p className="text-xs text-muted-foreground">Best performing category</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
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

        <TabsContent value="alerts" className="space-y-4">
          <StockAlerts />
        </TabsContent>
      </Tabs>
    </div>
  )
}
