"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { getCategories, getProducts, getSales, ProductCategory, Product, filterByTimeRange } from "@/lib/api"

interface CategoryPerformanceProps {
  timeRange: string
}

export function CategoryPerformance({ timeRange }: CategoryPerformanceProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categoryRevenueData, setCategoryRevenueData] = useState<any[]>([])
  const [categoryMetricsData, setCategoryMetricsData] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    async function load() {
      try {
  const [cats, prods, salesRaw] = await Promise.all([getCategories(), getProducts(), getSales()])
        if (!mounted) return

        setCategories(cats)
        setProducts(prods)

        // Map products by id for quick lookup
        const prodMap = new Map<number, any>()
        prods.forEach((p: any) => prodMap.set(p.id, p))

        // Initialize category buckets (including uncategorized)
        const catBuckets = new Map<number | string, any>()
        cats.forEach((c) => catBuckets.set(c.id, { category: c.name, revenue: 0, salesUnits: 0, inventory: 0 }))
        catBuckets.set('uncat', { category: 'Uncategorized', revenue: 0, salesUnits: 0, inventory: 0 })

        // Filter sales by timeRange then aggregate into categories
        const sales = filterByTimeRange(salesRaw || [], timeRange, 'sale_date')
        sales.forEach((s: any) => {
          const pid = s.product_id
          const prod = prodMap.get(pid)
          const catId = prod?.category_id ?? 'uncat'
          const bucket = catBuckets.get(catId) || { category: prod?.category?.name || 'Uncategorized', revenue: 0, salesUnits: 0, inventory: 0 }
          const salePrice = (s.sale_price ?? 0)
          bucket.revenue += salePrice * (s.quantity ?? 0)
          bucket.salesUnits += (s.quantity ?? 0)
          catBuckets.set(catId, bucket)
        })

        // Compute inventory per category
        prods.forEach((p: any) => {
          const catId = p.category_id ?? 'uncat'
          const bucket = catBuckets.get(catId) || { category: p.category?.name || 'Uncategorized', revenue: 0, salesUnits: 0, inventory: 0 }
          bucket.inventory += p.quantity
          catBuckets.set(catId, bucket)
        })

        // Build arrays for charts
        const revenueArr: any[] = Array.from(catBuckets.values()).map((b) => ({
          category: b.category,
          revenue: Math.round(b.revenue),
          growth: 0,
          margin: 0,
        }))

        // For radar metrics, normalize inventory and sales to 0-100
        const maxInventory = Math.max(...Array.from(catBuckets.values()).map((b) => b.inventory || 0), 1)
        const maxSales = Math.max(...Array.from(catBuckets.values()).map((b) => b.salesUnits || 0), 1)

        const metricsArr: any[] = Array.from(catBuckets.values()).map((b) => ({
          category: b.category,
          inventory: Math.round((b.inventory / maxInventory) * 100),
          sales: Math.round((b.salesUnits / maxSales) * 100),
          profit: b.revenue ? Math.round(Math.min(100, (b.revenue / (b.revenue + 1)) * 100)) : 0,
          satisfaction: 80,
        }))

        setCategoryRevenueData(revenueArr)
        setCategoryMetricsData(metricsArr)
      } catch (err: any) {
        setError(err?.message || 'Failed to load category analytics')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [timeRange])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
          <CardDescription>Category performance and growth rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: "Revenue ($)",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Performance Radar</CardTitle>
          <CardDescription>Multi-dimensional performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              inventory: {
                label: "Inventory",
                color: "hsl(var(--chart-1))",
              },
              sales: {
                label: "Sales",
                color: "hsl(var(--chart-2))",
              },
              profit: {
                label: "Profit",
                color: "hsl(var(--chart-3))",
              },
              satisfaction: {
                label: "Satisfaction",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={categoryMetricsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="sales"
                  stroke="var(--color-chart-2)"
                  fill="var(--color-chart-2)"
                  fillOpacity={0.3}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Detailed performance metrics for each category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryRevenueData.map((category) => (
              <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{category.category}</h4>
                    <Badge variant={category.revenue > 0 ? "default" : "destructive"}>
                      {category.revenue > 0 ? "+" : ""}
                      {Math.round((category.revenue || 0) / 100)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-medium">${(category.revenue || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Margin</p>
                      <p className="font-medium">{0}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Performance</p>
                      <Progress value={0} className="h-2 mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
