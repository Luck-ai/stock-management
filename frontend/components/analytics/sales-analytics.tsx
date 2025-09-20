"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
} from "recharts"
import { useEffect, useState } from "react"
import { getSales, getTopProducts, getProducts, filterByTimeRange } from "@/lib/api"

interface SalesAnalyticsProps {
  timeRange: string
}

export function SalesAnalytics({ timeRange }: SalesAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number; revenue: number }[]>([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    async function load() {
      try {
        // Fetch sales and products to compute top products within the selected timeRange
        const [salesRaw, products] = await Promise.all([getSales(), getProducts()])
        if (!mounted) return

        const sales = filterByTimeRange(salesRaw || [], timeRange, 'sale_date')

        const productMap = new Map<number, any>()
        products.forEach((p) => productMap.set(p.id, p))

        const agg = new Map<number, { sales: number; revenue: number }>()
        sales.forEach((s: any) => {
          const pid = s.product_id
          const entry = agg.get(pid) || { sales: 0, revenue: 0 }
          entry.sales += s.quantity ?? 0
          entry.revenue += (s.quantity ?? 0) * (s.sale_price ?? (productMap.get(pid)?.price || 0) / 100)
          agg.set(pid, entry)
        })

        const arr = Array.from(agg.entries()).map(([pid, v]) => ({
          name: productMap.get(pid)?.name || `Product ${pid}`,
          sales: v.sales,
          revenue: v.revenue,
        }))

        arr.sort((a, b) => b.sales - a.sales)
        setTopProducts(arr.slice(0, 10))
      } catch (err: any) {
        setError(err?.message || 'Failed to load sales data')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [timeRange])
  const salesTrendData: any[] = []
  const salesChannelData: { name: string; value: number; color: string }[] = [
    { name: 'Online Store', value: 45, color: 'hsl(var(--chart-1))' },
    { name: 'Retail Partners', value: 30, color: 'hsl(var(--chart-2))' },
    { name: 'Direct Sales', value: 15, color: 'hsl(var(--chart-3))' },
    { name: 'Marketplace', value: 10, color: 'hsl(var(--chart-4))' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Sales Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue and order volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: 'Revenue ($)',
                color: 'hsl(var(--chart-1))',
              },
              orders: {
                label: 'Orders',
                color: 'hsl(var(--chart-2))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar yAxisId="left" dataKey="revenue" fill="var(--color-chart-1)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="var(--color-chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performing products by sales volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              sales: {
                label: 'Units Sold',
                color: 'hsl(var(--chart-3))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Channels</CardTitle>
          <CardDescription>Revenue distribution by sales channel</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: {
                label: 'Percentage',
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesChannelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} ${Math.round((entry.value || 0))}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesChannelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
