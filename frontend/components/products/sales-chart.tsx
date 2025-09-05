"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart } from "recharts"

interface SalesChartProps {
  productId: string
}

// Mock sales data
const salesData = [
  { month: "Jan", sales: 45, revenue: 4495 },
  { month: "Feb", sales: 52, revenue: 5198 },
  { month: "Mar", sales: 38, revenue: 3798 },
  { month: "Apr", sales: 61, revenue: 6099 },
  { month: "May", sales: 55, revenue: 5495 },
  { month: "Jun", sales: 67, revenue: 6698 },
  { month: "Jul", sales: 43, revenue: 4297 },
  { month: "Aug", sales: 58, revenue: 5798 },
  { month: "Sep", sales: 49, revenue: 4899 },
  { month: "Oct", sales: 72, revenue: 7198 },
  { month: "Nov", sales: 65, revenue: 6498 },
  { month: "Dec", sales: 78, revenue: 7798 },
]

export function SalesChart({ productId }: SalesChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sales Volume</CardTitle>
          <CardDescription>Monthly sales units over the past year</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              sales: {
                label: "Units Sold",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue generated from this product</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: "Revenue ($)",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
