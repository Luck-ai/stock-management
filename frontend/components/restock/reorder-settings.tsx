"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, RotateCcw } from "lucide-react"

export function ReorderSettings() {
  const [settings, setSettings] = useState({
    autoReorderEnabled: true,
    defaultLeadTime: 7,
    safetyStockPercentage: 20,
    reorderPointMultiplier: 1.5,
    maxOrderQuantity: 1000,
    minOrderValue: 100,
    approvalRequired: true,
    approvalThreshold: 5000,
    emailNotifications: true,
    slackNotifications: false,
    defaultSupplierRating: "good",
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    setSettings({
      autoReorderEnabled: true,
      defaultLeadTime: 7,
      safetyStockPercentage: 20,
      reorderPointMultiplier: 1.5,
      maxOrderQuantity: 1000,
      minOrderValue: 100,
      approvalRequired: true,
      approvalThreshold: 5000,
      emailNotifications: true,
      slackNotifications: false,
      defaultSupplierRating: "good",
    })
  }

  return (
    <div className="space-y-6">
      {/* Auto Reorder Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Automatic Reorder Settings</span>
          </CardTitle>
          <CardDescription>Configure how the system automatically suggests and creates reorders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Automatic Reordering</Label>
              <p className="text-sm text-muted-foreground">
                Allow the system to automatically suggest reorders based on stock levels
              </p>
            </div>
            <Switch
              checked={settings.autoReorderEnabled}
              onCheckedChange={(checked) => handleSettingChange("autoReorderEnabled", checked)}
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leadTime">Default Lead Time (days)</Label>
              <Input
                id="leadTime"
                type="number"
                value={settings.defaultLeadTime}
                onChange={(e) => handleSettingChange("defaultLeadTime", Number.parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Default supplier lead time for calculations</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="safetyStock">Safety Stock Percentage</Label>
              <Input
                id="safetyStock"
                type="number"
                value={settings.safetyStockPercentage}
                onChange={(e) => handleSettingChange("safetyStockPercentage", Number.parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Extra stock to maintain as buffer</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderMultiplier">Reorder Point Multiplier</Label>
              <Input
                id="reorderMultiplier"
                type="number"
                step="0.1"
                value={settings.reorderPointMultiplier}
                onChange={(e) => handleSettingChange("reorderPointMultiplier", Number.parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Multiplier for calculating reorder points</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxQuantity">Maximum Order Quantity</Label>
              <Input
                id="maxQuantity"
                type="number"
                value={settings.maxOrderQuantity}
                onChange={(e) => handleSettingChange("maxOrderQuantity", Number.parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Maximum items in a single order</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Approval & Authorization</CardTitle>
          <CardDescription>Configure approval workflows for purchase orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Require Approval</Label>
              <p className="text-sm text-muted-foreground">Require manager approval before creating purchase orders</p>
            </div>
            <Switch
              checked={settings.approvalRequired}
              onCheckedChange={(checked) => handleSettingChange("approvalRequired", checked)}
            />
          </div>

          {settings.approvalRequired && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="approvalThreshold">Approval Threshold ($)</Label>
                <Input
                  id="approvalThreshold"
                  type="number"
                  value={settings.approvalThreshold}
                  onChange={(e) => handleSettingChange("approvalThreshold", Number.parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Orders above this value require approval</p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="minOrderValue">Minimum Order Value ($)</Label>
            <Input
              id="minOrderValue"
              type="number"
              value={settings.minOrderValue}
              onChange={(e) => handleSettingChange("minOrderValue", Number.parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Minimum total value for purchase orders</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive restock alerts and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email alerts for low stock and order updates</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Slack Notifications</Label>
              <p className="text-sm text-muted-foreground">Send notifications to Slack channels</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Coming Soon</Badge>
              <Switch
                checked={settings.slackNotifications}
                onCheckedChange={(checked) => handleSettingChange("slackNotifications", checked)}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Preferences</CardTitle>
          <CardDescription>Default settings for supplier selection and ordering</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplierRating">Default Supplier Rating Filter</Label>
            <Select
              value={settings.defaultSupplierRating}
              onValueChange={(value) => handleSettingChange("defaultSupplierRating", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent Only</SelectItem>
                <SelectItem value="good">Good and Above</SelectItem>
                <SelectItem value="fair">Fair and Above</SelectItem>
                <SelectItem value="all">All Suppliers</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only suggest suppliers with this rating or higher</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
