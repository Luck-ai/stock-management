"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { getSuppliers, getPurchaseOrders, Supplier, PurchaseOrder, filterByTimeRange } from "@/lib/api"

interface SupplierAnalyticsProps {
  timeRange: string
}

export function SupplierAnalytics({ timeRange }: SupplierAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ordersData, setOrdersData] = useState<{ supplier: string; orders: number; value: number }[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    async function load() {
      try {
  const [suppliers, ordersRaw] = await Promise.all([getSuppliers(), getPurchaseOrders()])
        if (!mounted) return

        const supMap = new Map<number, string>()
        suppliers.forEach((s: any) => supMap.set(s.id, s.name))

        // Aggregate orders per supplier
        const agg = new Map<number | string, { supplier: string; orders: number; value: number; completed: number }>()

        // Initialize suppliers in map
        suppliers.forEach((s: any) => agg.set(s.id, { supplier: s.name, orders: 0, value: 0, completed: 0 }))

  const orders = filterByTimeRange(ordersRaw || [], timeRange, 'order_date')
  orders.forEach((o: any) => {
          const sid = o.supplier_id ?? 'unknown'
          const name = supMap.get(o.supplier_id) || 'Unknown'
          const entry = agg.get(sid) || { supplier: name, orders: 0, value: 0, completed: 0 }
          entry.orders += 1
          const productPrice = o.product?.price ?? 0
          entry.value += (productPrice / 100) * (o.quantity_ordered || 0)
          if (o.status === 'completed') entry.completed += 1
          agg.set(sid, entry)
        })

        const ordersArr = Array.from(agg.values()).map((v) => ({ supplier: v.supplier, orders: v.orders, value: Math.round(v.value) }))
        setOrdersData(ordersArr)

        // Build performance data, aggregating rating fields from orders
        const ratingsAgg = new Map<number | string, { supplier: string; orders: number; onTimeSum: number; onTimeCount: number; qualitySum: number; qualityCount: number; costSum: number; costCount: number; overallSum: number; overallCount: number }>()
        Array.from(agg.keys()).forEach((k) => {
          const base = agg.get(k)!
          ratingsAgg.set(k, { supplier: base.supplier, orders: base.orders, onTimeSum: 0, onTimeCount: 0, qualitySum: 0, qualityCount: 0, costSum: 0, costCount: 0, overallSum: 0, overallCount: 0 })
        })

        // accumulate ratings from orders
        orders.forEach((o: any) => {
          const sid = o.supplier_id ?? 'unknown'
          const r = ratingsAgg.get(sid) || { supplier: (supMap.get(o.supplier_id) || 'Unknown'), orders: 0, onTimeSum: 0, onTimeCount: 0, qualitySum: 0, qualityCount: 0, costSum: 0, costCount: 0, overallSum: 0, overallCount: 0 }
          if (typeof o.on_time_delivery === 'number') { r.onTimeSum += o.on_time_delivery; r.onTimeCount += 1 }
          if (typeof o.quality_score === 'number') { r.qualitySum += o.quality_score; r.qualityCount += 1 }
          if (typeof o.cost_efficiency === 'number') { r.costSum += o.cost_efficiency; r.costCount += 1 }
          if (typeof o.overall_rating === 'number') { r.overallSum += o.overall_rating; r.overallCount += 1 }
          ratingsAgg.set(sid, r)
        })

        // Convert the aggregated sums/counts into proper averages per supplier.
        const perf = Array.from(ratingsAgg.entries()).map(([key, v]) => {
          // on_time_delivery, quality_score, cost_efficiency are stored as percentages (0-100)
          const onTimeAvg = v.onTimeCount > 0 ? Math.round(v.onTimeSum / v.onTimeCount) : null
          const qualityAvg = v.qualityCount > 0 ? Math.round(v.qualitySum / v.qualityCount) : null
          const costAvg = v.costCount > 0 ? Math.round(v.costSum / v.costCount) : null

          // overall_rating is stored as 1-5. Convert average to 0-100 by multiplying by 20.
          const overallAvg = v.overallCount > 0 ? Math.round((v.overallSum / v.overallCount) * 20) : null

          // Fallback for on-time: if no explicit delivery ratings, compute completion rate as percent
          const fallbackOnTime = (() => {
            if (onTimeAvg !== null) return onTimeAvg
            // key may be supplier id or 'unknown' so find agg entry by matching supplier name when possible
            const aggEntry = agg.get(key) || Array.from(agg.values()).find(a => a.supplier === v.supplier)
            if (!aggEntry) return 0
            const completed = aggEntry.completed ?? 0
            const ordersCount = aggEntry.orders ?? 1
            return Math.round((completed / Math.max(ordersCount, 1)) * 100)
          })()

          return {
            supplier: v.supplier,
            orders: v.orders,
            onTime: fallbackOnTime,
            quality: qualityAvg ?? 0,
            cost: costAvg ?? 0,
            overall: overallAvg ?? 0,
          }
        })

        setPerformanceData(perf)
      } catch (err: any) {
        setError(err?.message || 'Failed to load supplier analytics')
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Supplier Order Volume</CardTitle>
          <CardDescription>Number of orders placed with each supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              orders: {
                label: 'Orders',
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Order Value</CardTitle>
          <CardDescription>Total value of orders by supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: {
                label: 'Order Value ($)',
                color: 'hsl(var(--chart-2))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Supplier Performance Scorecard</CardTitle>
          <CardDescription>Key performance indicators for each supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>On-Time Delivery</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Cost Efficiency</TableHead>
                <TableHead>Overall Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((supplier: any) => {
                  const overallScore = Math.round((supplier.onTime + supplier.quality + supplier.cost) / 3)
                  const getRatingBadge = (score: number) => {
                    if (score >= 90) return <Badge variant="default">Excellent</Badge>
                    if (score >= 80) return <Badge variant="secondary">Good</Badge>
                    if (score >= 70) return <Badge variant="outline">Fair</Badge>
                    return <Badge variant="destructive">Poor</Badge>
                  }

                  return (
                    <TableRow key={supplier.supplier}>
                      <TableCell className="font-medium">{supplier.supplier}</TableCell>
                      <TableCell>{supplier.orders}</TableCell>
                      <TableCell>{supplier.onTime}%</TableCell>
                      <TableCell>{supplier.quality}%</TableCell>
                      <TableCell>{supplier.cost}%</TableCell>
                      <TableCell>{getRatingBadge(overallScore)}</TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
