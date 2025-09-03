"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, RefreshCw, Plus, Download, Loader2 } from "lucide-react"
import { AutoReorderSuggestions } from "./auto-reorder-suggestions"
import { ManualReorder } from "./manual-reorder"
import { PurchaseOrders } from "./purchase-orders"
import { RestockHistory } from "./restock-history"
import { ReorderSettings } from "./reorder-settings"
import { usePurchaseOrders, useRestockSuggestions, useInventoryStats } from "@/lib/hooks/use-api"
import { handleApiError } from "@/lib/api"

export function RestockManagement() {
  const [activeTab, setActiveTab] = useState("suggestions")

  const { data: purchaseOrders, loading: ordersLoading, error: ordersError } = usePurchaseOrders()
  const { data: suggestions, loading: suggestionsLoading, error: suggestionsError } = useRestockSuggestions()
  const { data: inventoryStats, loading: inventoryLoading, error: inventoryError } = useInventoryStats()

  const loading = ordersLoading || suggestionsLoading || inventoryLoading
  const error = ordersError || suggestionsError || inventoryError

  // Calculate summary data from API responses
  const pendingOrders =
    purchaseOrders?.filter((order) => order.status === "PENDING" || order.status === "APPROVED").length || 0
  const autoSuggestions = suggestions?.length || 0
  const totalValue =
    purchaseOrders
      ?.filter((order) => order.status === "PENDING" || order.status === "APPROVED")
      .reduce((sum, order) => sum + order.total_amount, 0) || 0
  const criticalItems = suggestions?.filter((suggestion) => suggestion.urgency === "high").length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Restock Management</h1>
          <p className="text-muted-foreground">Manage inventory replenishment and purchase orders</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setActiveTab("manual")}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{handleApiError(error)}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground">Active purchase orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Suggestions</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : autoSuggestions}
            </div>
            <p className="text-xs text-muted-foreground">Items to reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Value</CardTitle>
            <RefreshCw className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `$${totalValue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">Pending order value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
            <RefreshCw className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : criticalItems}
            </div>
            <p className="text-xs text-muted-foreground">High priority items</p>
          </CardContent>
        </Card>
      </div>

      {/* Restock Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="suggestions">Auto Suggestions</TabsTrigger>
          <TabsTrigger value="manual">Manual Reorder</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <AutoReorderSuggestions />
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <ManualReorder />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <PurchaseOrders />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <RestockHistory />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ReorderSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
