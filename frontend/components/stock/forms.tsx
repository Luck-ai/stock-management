"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function SupplierForm({
  onSave,
  onCancel,
  open,
  onOpenChange,
}: {
  onSave: (s: { name: string; email?: string; phone?: string; address?: string }) => void
  onCancel: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({ name: form.name.trim(), email: form.email.trim() || undefined, phone: form.phone.trim() || undefined, address: form.address.trim() || undefined })
    setForm({ name: "", email: "", phone: "", address: "" })
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
          <DialogDescription>Add a new supplier to your list.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button type="submit">Save Supplier</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CategoryForm({
  onSave,
  onCancel,
  open,
  onOpenChange,
}: {
  onSave: (c: { name: string; description?: string }) => void
  onCancel: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [form, setForm] = useState({ name: "", description: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({ name: form.name.trim(), description: form.description.trim() || undefined })
    setForm({ name: "", description: "" })
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Add a new product category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
