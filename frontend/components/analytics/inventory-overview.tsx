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
  Area,
  AreaChart,
  Bar,
  BarChart,
} from "recharts"
import { isOutOfStock, isLowStock, getThreshold } from "@/lib/stock-utils"
import { useEffect, useState } from "react"
import { getProducts, getCategories, getSales, Product, ProductCategory, filterByTimeRange } from "@/lib/api"

interface InventoryOverviewProps {
  timeRange: string
}

// Basic placeholders; we'll compute real values from API
const defaultTrend = [{ date: "Now", totalValue: 0, totalItems: 0, turnoverRate: 0 }]

export function InventoryOverview({ timeRange }: InventoryOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [stockLevelData, setStockLevelData] = useState<any[]>([])
  const [inventoryTrendData, setInventoryTrendData] = useState<any[]>(defaultTrend)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    async function load() {
      try {
  const [p, c, salesRaw] = await Promise.all([getProducts(), getCategories(), getSales()])
        if (!mounted) return
        setProducts(p)
        setCategories(c)

        // Compute stock by category
        const catMap = new Map<number, any>()
        c.forEach((cat) => catMap.set(cat.id, { category: cat.name, inStock: 0, lowStock: 0, outOfStock: 0 }))

        p.forEach((prod: any) => {
          const catId = prod.category_id
          const catEntry = catMap.get(catId) || { category: prod.category?.name || 'Uncategorized', inStock: 0, lowStock: 0, outOfStock: 0 }
          
          if (isOutOfStock(prod)) catEntry.outOfStock += 1
          else if (isLowStock(prod)) catEntry.lowStock += 1
          else catEntry.inStock += prod.quantity
          
          catMap.set(catId, catEntry)
        })

        setStockLevelData(Array.from(catMap.values()))

        // Inventory total value
  const totalValue = p.reduce((sum: number, prod: any) => sum + (prod.price / 100) * prod.quantity, 0)
  const totalItems = p.reduce((sum: number, prod: any) => sum + prod.quantity, 0)

  // Compute turnoverRate using sales within timeRange: units sold divided by average inventory.
  const sales = filterByTimeRange(salesRaw || [], timeRange, 'sale_date')
  const unitsSoldInRange = sales.reduce((sum: number, s: any) => sum + (s.quantity ?? 0), 0)
  const turnoverRate = totalItems > 0 ? Math.round((unitsSoldInRange / totalItems) * 100) : 0

  setInventoryTrendData([{ date: 'Now', totalValue: Math.round(totalValue), totalItems, turnoverRate }])
      } catch (err: any) {
        setError(err?.message || 'Failed to load inventory')
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
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Inventory Value Trend</CardTitle>
          <CardDescription>Total inventory value and item count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              totalValue: {
                label: "Total Value ($)",
                color: "hsl(var(--chart-1))",
              },
              totalItems: {
                label: "Total Items",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inventoryTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalValue"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalItems"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels by Category</CardTitle>
          <CardDescription>Current stock status across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              inStock: {
                label: "In Stock",
                color: "hsl(var(--chart-1))",
              },
              lowStock: {
                label: "Low Stock",
                color: "hsl(var(--chart-4))",
              },
              outOfStock: {
                label: "Out of Stock",
                color: "hsl(var(--chart-5))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockLevelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="inStock" stackId="a" fill="var(--color-chart-1)" />
                <Bar dataKey="lowStock" stackId="a" fill="var(--color-chart-4)" />
                <Bar dataKey="outOfStock" stackId="a" fill="var(--color-chart-5)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Turnover Rate</CardTitle>
          <CardDescription>How quickly inventory is sold and replaced</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              turnoverRate: {
                label: "Turnover Rate",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="turnoverRate" stroke="var(--color-chart-3)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
