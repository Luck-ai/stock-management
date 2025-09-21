"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from '@/lib/utils'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, AlertTriangle, Eye, Package, DollarSign, List, Grid } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export interface TableColumn {
  key: string
  label: string
  className?: string
  render?: (value: any, item: any) => React.ReactNode
}

export interface TableAction {
  icon: React.ReactNode
  label: string
  onClick?: (item: any) => void
  variant?: "ghost" | "default" | "destructive" | "outline" | "secondary"
  href?: string
}

export interface UnifiedTableProps {
  data: any[]
  columns: TableColumn[]
  actions?: TableAction[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  onDelete?: (id: string, name?: string) => void
  getItemId?: (item: any) => string
  getItemName?: (item: any) => string
  // Card view specific props
  enableCardView?: boolean
  cardViewConfig?: {
    titleField?: string
    subtitleField?: string
    descriptionField?: string
    priceField?: string
    quantityField?: string
    categoryField?: string
    statusField?: string
    imageField?: string
    lowStockThresholdField?: string
  }
}

export function UnifiedTable({
  data,
  columns,
  actions = [],
  loading = false,
  error = null,
  emptyMessage = "No items found",
  onDelete,
  getItemId = (item) => item.id,
  getItemName = (item) => item.name,
  enableCardView = false,
  cardViewConfig = {}
}: UnifiedTableProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name?: string } | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const handleDelete = (item: any) => {
    const id = getItemId(item)
    const name = getItemName(item)
    setPendingDelete({ id, name })
    setConfirmOpen(true)
  }

  const performDelete = async () => {
    if (!pendingDelete || !onDelete) return
    try {
      setConfirmError(null)
      await onDelete(pendingDelete.id, pendingDelete.name)
      setConfirmOpen(false)
      setPendingDelete(null)
    } catch (err: any) {
      setConfirmError(err?.message || 'Error deleting item')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in stock":
        return "bg-green-100 text-green-800"
      case "low stock":
        return "bg-yellow-100 text-yellow-800"
      case "out of stock":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in stock":
        return <Package className="h-3 w-3" />
      case "low stock":
        return <AlertTriangle className="h-3 w-3" />
      case "out of stock":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  const getStockStatus = (quantity: number, threshold: number) => {
    if (!threshold || threshold <= 0) {
      if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
      return { label: "In Stock", variant: "default" as const }
    }

    const margin = Math.ceil(threshold * 0.2) 

    if (quantity < threshold) return { label: "Out of Stock", variant: "destructive" as const }
    if (Math.abs(threshold - quantity) <= margin) return { label: "Low Stock", variant: "secondary" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  const renderCardView = () => {
    const {
      titleField = 'name',
      subtitleField = 'sku',
      descriptionField = 'description',
      priceField = 'price',
      quantityField = 'quantity',
      categoryField = 'category',
      statusField = 'status',
      imageField = 'image',
      lowStockThresholdField = 'lowStockThreshold'
    } = cardViewConfig

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {data.map((item) => {
          // Compute actual stock status if we have quantity and threshold data
          let status = item[statusField] || 'In Stock'
          const quantity = item[quantityField]
          const threshold = item[lowStockThresholdField]
          
          if (quantity !== undefined && threshold !== undefined) {
            const computed = getStockStatus(quantity, threshold)
            status = computed.label
          }
          
          return (
            <Card key={getItemId(item)} className="hover:shadow-xl transition-all duration-300 bg-transparent backdrop-blur-sm shadow-lg transform hover:-translate-y-1 border border-white/10 hover:border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                      {item[imageField] ? (
                        <img src={item[imageField]} alt={item[titleField]} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item[titleField]}</CardTitle>
                      {item[subtitleField] && (
                        <p className="text-sm text-muted-foreground">{item[subtitleField]}</p>
                      )}
                    </div>
                  </div>
                  {item[statusField] && (
                    <Badge className={getStatusColor(status)}>
                      {getStatusIcon(status)}
                      <span className="ml-1">{status}</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {item[descriptionField] && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item[descriptionField]}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {item[priceField] && (
                    <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="font-semibold text-green-300">${Number(item[priceField]).toFixed(2)}</span>
                    </div>
                  )}
                  {item[quantityField] !== undefined && (
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
                      status?.toLowerCase() === 'out of stock' 
                        ? 'bg-red-500/20' 
                        : status?.toLowerCase() === 'low stock' 
                        ? 'bg-yellow-500/20' 
                        : 'bg-green-500/20'
                    }`}>
                      <Package className={`h-4 w-4 ${
                        status?.toLowerCase() === 'out of stock' 
                          ? 'text-red-400' 
                          : status?.toLowerCase() === 'low stock' 
                          ? 'text-yellow-400' 
                          : 'text-green-400'
                      }`} />
                      <span className={`font-medium ${
                        status?.toLowerCase() === 'out of stock' 
                          ? 'text-red-300' 
                          : status?.toLowerCase() === 'low stock' 
                          ? 'text-yellow-300' 
                          : 'text-green-300'
                      }`}>{item[quantityField]} units</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    {item[categoryField] && (
                      <span className="text-sm bg-white/10 px-2 py-1 rounded-full text-gray-300 font-medium backdrop-blur-sm">{item[categoryField]}</span>
                    )}
                  </div>
                  {actions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {actions.map((action, actionIndex) => {
                        if (action.href) {
                          return (
                            <Button 
                              key={actionIndex}
                              variant={action.variant || "ghost"} 
                              size="sm" 
                              asChild
                            >
                              <Link href={action.href.replace(':id', getItemId(item))}>
                                {action.icon}
                              </Link>
                            </Button>
                          )
                        }
                        
                        return (
                          <Button
                            key={actionIndex}
                            variant={action.variant || "ghost"}
                            size="sm"
                            onClick={() => {
                              if (action.label === 'Delete' && onDelete) {
                                handleDelete(item)
                              } else if (action.onClick) {
                                action.onClick(item)
                              }
                            }}
                          >
                            {action.icon}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {enableCardView && (
        <div className="flex items-center justify-end space-x-2 mb-4">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('list')}
          >
            <List className="mr-2 h-4 w-4" /> List
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('grid')}
          >
            <Grid className="mr-2 h-4 w-4" /> Grid
          </Button>
        </div>
      )}

      {viewMode === 'grid' && enableCardView ? (
        <div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">Error: {error}</div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            renderCardView()
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="border-b-2" style={{ borderColor: 'var(--ui-table-header-border)' }}>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.label}
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="text-center py-8 text-destructive">
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="text-center py-8 text-sm text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow 
                    key={getItemId(item)} 
                    style={{ borderTop: '2px solid var(--ui-table-row-border)' }}
                    className="align-top bg-ui-table-row hover:bg-ui-table-row-hover"
                  >
                    {/* Checkbox column removed */}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={cn(column.className, 'py-6')}>
                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell className="text-right py-6">
                        <div className="flex items-center justify-end space-x-2">
                          {actions.map((action, actionIndex) => {
                            if (action.href) {
                              return (
                                <Button 
                                  key={actionIndex}
                                  variant={action.variant || "ghost"} 
                                  size="sm" 
                                  asChild
                                >
                                  <Link href={action.href.replace(':id', getItemId(item))}>
                                    {action.icon}
                                  </Link>
                                </Button>
                              )
                            }
                            
                            return (
                              <Button
                                key={actionIndex}
                                variant={action.variant || "ghost"}
                                size="sm"
                                onClick={() => {
                                  if (action.label === 'Delete' && onDelete) {
                                    handleDelete(item)
                                  } else if (action.onClick) {
                                    action.onClick(item)
                                  }
                                }}
                              >
                                {action.icon}
                              </Button>
                            )
                          })}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) {
            setPendingDelete(null)
            setConfirmError(null)
          }
        }}
        title="Delete item"
        description={
          pendingDelete?.name 
            ? `Delete '${pendingDelete.name}'? This action cannot be undone.`
            : "Are you sure you want to delete this item? This action cannot be undone."
        }
        error={confirmError}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={performDelete}
      />
    </>
  )
}