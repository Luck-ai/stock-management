"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface StockMovementChartProps {
  productId: string
}

// Mock stock movement data
const stockMovementData = [
  { date: "2024-01-01", stock: 100 },
  { date: "2024-01-05", stock: 85 },
  { date: "2024-01-10", stock: 92 },
  { date: "2024-01-15", stock: 78 },
  { date: "2024-01-20", stock: 65 },
  { date: "2024-01-25", stock: 73 },
  { date: "2024-01-30", stock: 45 },
]

const recentMovements = [
  { date: "2024-01-30", type: "Sale", quantity: -15, reason: "Customer order #1234", balance: 45 },
  { date: "2024-01-28", type: "Restock", quantity: +25, reason: "Supplier delivery", balance: 60 },
  { date: "2024-01-25", type: "Sale", quantity: -8, reason: "Bulk order #1233", balance: 35 },
  { date: "2024-01-22", type: "Adjustment", quantity: -2, reason: "Damaged items", balance: 43 },
  { date: "2024-01-20", type: "Sale", quantity: -12, reason: "Customer order #1232", balance: 45 },
]

export function StockMovementChart({ productId }: StockMovementChartProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Stock Level History</CardTitle>
          <CardDescription>Stock quantity changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              stock: {
                label: "Stock Level",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockMovementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="stock" stroke="var(--color-chart-3)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
          <CardDescription>Latest inventory changes and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMovements.map((movement, index) => (
                <TableRow key={index}>
                  <TableCell>{movement.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        movement.type === "Sale" ? "destructive" : movement.type === "Restock" ? "default" : "secondary"
                      }
                    >
                      {movement.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={movement.quantity > 0 ? "text-green-600" : "text-red-600"}>
                    {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity}
                  </TableCell>
                  <TableCell>{movement.reason}</TableCell>
                  <TableCell className="font-medium">{movement.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
