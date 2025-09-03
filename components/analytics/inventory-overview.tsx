"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart, Bar, BarChart } from "recharts"
import { useInventoryStats, useSalesAnalytics, useCategoryPerformance } from "@/lib/hooks/use-api"
import { handleApiError } from "@/lib/api"

interface InventoryOverviewProps {
  timeRange: string
}

export function InventoryOverview({ timeRange }: InventoryOverviewProps) {
  const { data: inventoryStats, loading: inventoryLoading, error: inventoryError } = useInventoryStats()

  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
  } = useSalesAnalytics({
    start_date: getStartDate(timeRange),
    end_date: new Date().toISOString().split("T")[0],
    group_by: getGroupBy(timeRange),
  })

  const { data: categoryData, loading: categoryLoading, error: categoryError } = useCategoryPerformance()

  const loading = inventoryLoading || salesLoading || categoryLoading
  const error = inventoryError || salesError || categoryError

  // Helper functions
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

  function getGroupBy(range: string): "day" | "week" | "month" {
    switch (range) {
      case "7d":
        return "day"
      case "30d":
        return "day"
      case "90d":
        return "week"
      case "1y":
        return "month"
      default:
        return "day"
    }
  }

  // Transform API data for charts
  const inventoryTrendData =
    salesData?.sales_by_period?.map((item) => ({
      date: new Date(item.period).toLocaleDateString("en-US", {
        month: "short",
        day: timeRange === "1y" ? undefined : "numeric",
      }),
      totalValue: inventoryStats?.total_value || 0,
      totalItems: inventoryStats?.total_products || 0,
      turnoverRate: (item.sales / (inventoryStats?.total_products || 1)) * 100,
    })) || []

  const stockLevelData =
    categoryData?.map((category) => ({
      category: category.category,
      inStock: category.total_products - (category.low_stock_count || 0) - (category.out_of_stock_count || 0),
      lowStock: category.low_stock_count || 0,
      outOfStock: category.out_of_stock_count || 0,
    })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>Sales performance over the selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              sales: {
                label: "Sales",
                color: "hsl(var(--chart-1))",
              },
              revenue: {
                label: "Revenue ($)",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData?.sales_by_period || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: timeRange === "1y" ? undefined : "numeric",
                    })
                  }
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.3}
                />
                <Line yAxisId="right" type="monotone" dataKey="sales" stroke="var(--color-chart-2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Revenue by product category</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              total_revenue: {
                label: "Revenue",
                color: "hsl(var(--chart-1))",
              },
              total_sales: {
                label: "Sales",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total_revenue" fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
          <CardDescription>Current inventory statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Products</span>
              <span className="text-2xl font-bold">{inventoryStats?.total_products || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Value</span>
              <span className="text-2xl font-bold">${inventoryStats?.total_value?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-yellow-600">Low Stock</span>
              <span className="text-2xl font-bold text-yellow-600">{inventoryStats?.low_stock_count || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-600">Out of Stock</span>
              <span className="text-2xl font-bold text-red-600">{inventoryStats?.out_of_stock_count || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
