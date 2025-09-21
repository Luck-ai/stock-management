"use client"

import React, { useState } from "react"
import { useEffect } from "react"
import { apiFetch } from '@/lib/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Uploads are handled from the Inventory header; remove toast/upload state here
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
  suppliers,
  initial,
  onUpdate,
}: {
  onSave: (s: { name: string; email?: string; phone?: string; address?: string }) => void
  onCancel: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  suppliers?: string[]
  initial?: { id?: number; name?: string; email?: string; phone?: string; address?: string }
  onUpdate?: (updated: any) => void
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" })

  useEffect(() => {
    if (initial) {
      setForm({ name: initial.name ?? '', email: initial.email ?? '', phone: initial.phone ?? '', address: initial.address ?? '' })
    } else {
      setForm({ name: '', email: '', phone: '', address: '' })
    }
  }, [initial, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = { name: form.name.trim(), email: form.email.trim() || undefined, phone: form.phone.trim() || undefined, address: form.address.trim() || undefined }
    if (initial && initial.id) {
      try {
        const res = await apiFetch(`/suppliers/${initial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          console.error('Failed to update supplier', await res.text().catch(() => ''))
        } else {
          const updated = await res.json()
          onUpdate && onUpdate(updated)
        }
      } catch (err) {
        console.error('Error updating supplier', err)
      }
    } else {
      onSave(payload)
    }
    setForm({ name: '', email: '', phone: '', address: '' })
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  // forms are add/edit only; view/delete moved to main inventory views

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: 'var(--ui-card-bg)' }}>
        <DialogHeader>
          <DialogTitle>Manage Suppliers</DialogTitle>
          <DialogDescription>View and add suppliers. Use the form to add a new supplier to your list.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <div className="pt-0 md:col-span-1">
            {/* Upload handled from the Inventory header; keep this column for layout if needed */}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="mb-2 block">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label className="mb-2 block">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label className="mb-2 block">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label className="mb-2 block">Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={handleCancel}>Close</Button>
              <Button type="submit">Save Supplier</Button>
            </div>
          </form>
        </div>
        {/* details and delete moved to main inventory views */}
      </DialogContent>
    </Dialog>
  )
}

export function CategoryForm({
  onSave,
  onCancel,
  open,
  onOpenChange,
  categories,
  initial,
  onUpdate,
}: {
  onSave: (c: { name: string; description?: string }) => void
  onCancel: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  categories?: string[]
  initial?: { id?: number; name?: string; description?: string }
  onUpdate?: (updated: any) => void
}) {
  const [form, setForm] = useState({ name: "", description: "" })

  useEffect(() => {
    if (initial) {
      setForm({ name: initial.name ?? '', description: initial.description ?? '' })
    } else {
      setForm({ name: '', description: '' })
    }
  }, [initial, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = { name: form.name.trim(), description: form.description.trim() || undefined }
    if (initial && initial.id) {
      try {
        const res = await apiFetch(`/categories/${initial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) {
          console.error('Failed to update category', await res.text().catch(() => ''))
        } else {
          const updated = await res.json()
          onUpdate && onUpdate(updated)
        }
      } catch (err) {
        console.error('Error updating category', err)
      }
    } else {
      onSave(payload)
    }
    setForm({ name: '', description: '' })
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: 'var(--ui-card-bg)' }}>
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>View and add product categories.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <div className="pt-0 md:col-span-1">
            {/* Upload handled from the Inventory header; keep this column for layout if needed */}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="mb-2 block">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label className="mb-2 block">Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={handleCancel}>Close</Button>
              <Button type="submit">Save Category</Button>
            </div>
          </form>
        </div>
        {/* details and delete moved to main inventory views */}
      </DialogContent>
    </Dialog>
  )
}
