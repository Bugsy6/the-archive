"use client"

import { useState } from "react"
import Link from "next/link"
import type { Collection } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusIcon, PencilIcon, Trash2Icon, PackageIcon, ArrowRightIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type CollectionWithCount = Collection & { _count: { items: number } }

interface CollectionsManagerProps {
  initialCollections: CollectionWithCount[]
}

interface CollectionFormData {
  name: string
  slug: string
  icon: string
  description: string
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export function CollectionsManager({ initialCollections }: CollectionsManagerProps) {
  const router = useRouter()
  const [collections, setCollections] = useState(initialCollections)
  const [createOpen, setCreateOpen] = useState(false)
  const [editCollection, setEditCollection] = useState<CollectionWithCount | null>(null)
  const [deleteCollection, setDeleteCollection] = useState<CollectionWithCount | null>(null)
  const [form, setForm] = useState<CollectionFormData>({ name: "", slug: "", icon: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setForm({ name: "", slug: "", icon: "", description: "" })
    setCreateOpen(true)
  }

  const openEdit = (col: CollectionWithCount) => {
    setForm({ name: col.name, slug: col.slug, icon: col.icon ?? "", description: col.description ?? "" })
    setEditCollection(col)
  }

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug === slugify(f.name) || f.slug === "" ? slugify(name) : f.slug,
    }))
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          icon: form.icon.trim() || null,
          description: form.description.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create collection")
      }
      const created: Collection = await res.json()
      setCollections((prev) => [...prev, { ...created, _count: { items: 0 } }].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success("Collection created")
      setCreateOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create collection")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editCollection || !form.name.trim() || !form.slug.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/collections/${editCollection.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          icon: form.icon.trim() || null,
          description: form.description.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to update collection")
      }
      const updated: Collection = await res.json()
      setCollections((prev) =>
        prev.map((c) => c.id === editCollection.id ? { ...c, ...updated } : c)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      toast.success("Collection updated")
      setEditCollection(null)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update collection")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCollection) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/collections/${deleteCollection.slug}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to delete")
      }
      setCollections((prev) => prev.filter((c) => c.id !== deleteCollection.id))
      toast.success("Collection deleted")
      setDeleteCollection(null)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete collection")
    } finally {
      setDeleting(false)
    }
  }

  const CollectionFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1 space-y-1.5">
          <Label className="text-zinc-300">Icon</Label>
          <Input
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            placeholder="📦"
            className="bg-zinc-700 border-zinc-600 text-zinc-100 text-center text-lg"
            maxLength={4}
          />
        </div>
        <div className="col-span-3 space-y-1.5">
          <Label className="text-zinc-300">Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Collection name"
            className="bg-zinc-700 border-zinc-600 text-zinc-100"
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Slug *</Label>
        <Input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="url-slug"
          className="bg-zinc-700 border-zinc-600 text-zinc-100 font-mono text-sm"
        />
        <p className="text-xs text-zinc-500">Used in URLs: /{form.slug || "slug"}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional description"
          rows={2}
          className="bg-zinc-700 border-zinc-600 text-zinc-100 resize-none"
        />
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={<Button size="sm" className="gap-1.5" onClick={openCreate} />}
          >
            <PlusIcon className="size-4" />
            New collection
          </DialogTrigger>
          <DialogContent className="bg-zinc-800 border-zinc-700 max-w-sm">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-zinc-100">Create collection</h2>
              <CollectionFormFields />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateOpen(false)}
                  className="border-zinc-700"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={saving}>
                  {saving ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <PackageIcon className="size-10 mx-auto mb-2 opacity-50" />
          <p>No collections yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((col) => (
            <div
              key={col.id}
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 border border-zinc-700"
            >
              <span className="text-2xl w-8 text-center shrink-0">{col.icon ?? "📦"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-100">{col.name}</div>
                <div className="text-xs text-zinc-500 font-mono">/{col.slug}</div>
                {col.description && (
                  <div className="text-xs text-zinc-400 mt-0.5 truncate">{col.description}</div>
                )}
              </div>
              <span className="text-sm text-zinc-400 tabular-nums shrink-0">
                {col._count.items} item{col._count.items !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-1 shrink-0">
                <Link href={`/${col.slug}`}>
                  <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-zinc-200">
                    <ArrowRightIcon className="size-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(col)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteCollection(col)}
                  className="text-zinc-400 hover:text-red-400"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editCollection} onOpenChange={(o) => { if (!o) setEditCollection(null) }}>
        <DialogContent className="bg-zinc-800 border-zinc-700 max-w-sm">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-100">Edit collection</h2>
            <CollectionFormFields />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditCollection(null)}
                className="border-zinc-700"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteCollection} onOpenChange={(o) => { if (!o) setDeleteCollection(null) }}>
        <DialogContent className="bg-zinc-800 border-zinc-700 max-w-sm">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-100">Delete collection?</h2>
            <p className="text-sm text-zinc-400">
              Delete <strong className="text-zinc-200">{deleteCollection?.name}</strong>?
              {deleteCollection && deleteCollection._count.items > 0 && (
                <span className="block mt-1 text-red-400">
                  This will permanently delete all {deleteCollection._count.items} item{deleteCollection._count.items !== 1 ? "s" : ""} and their photos.
                </span>
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteCollection(null)}
                className="border-zinc-700"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
