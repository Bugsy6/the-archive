"use client"

import { useState } from "react"
import type { Tag, Collection } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon, PencilIcon, Trash2Icon, TagIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type TagWithRelations = Tag & {
  collection: Collection | null
  _count: { items: number }
}

interface TagsManagerProps {
  initialTags: TagWithRelations[]
  collections: Collection[]
}

interface TagFormData {
  name: string
  color: string
  collectionId: string
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
]

export function TagsManager({ initialTags, collections }: TagsManagerProps) {
  const router = useRouter()
  const [tags, setTags] = useState(initialTags)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTag, setEditTag] = useState<TagWithRelations | null>(null)
  const [deleteTag, setDeleteTag] = useState<TagWithRelations | null>(null)
  const [form, setForm] = useState<TagFormData>({ name: "", color: "", collectionId: "__global__" })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setForm({ name: "", color: "", collectionId: "__global__" })
    setCreateOpen(true)
  }

  const openEdit = (tag: TagWithRelations) => {
    setForm({
      name: tag.name,
      color: tag.color ?? "",
      collectionId: tag.collectionId ?? "__global__",
    })
    setEditTag(tag)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color || null,
          collectionId: form.collectionId === "__global__" ? null : form.collectionId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create tag")
      }
      toast.success("Tag created")
      setCreateOpen(false)
      router.refresh()
      // Optimistic update isn't great here since we need the full object; just refresh
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create tag")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editTag || !form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tags/${editTag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to update tag")
      }
      const updated: Tag = await res.json()
      setTags((prev) =>
        prev.map((t) =>
          t.id === editTag.id ? { ...t, name: updated.name, color: updated.color } : t
        )
      )
      toast.success("Tag updated")
      setEditTag(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update tag")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTag) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tags/${deleteTag.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to delete")
      }
      setTags((prev) => prev.filter((t) => t.id !== deleteTag.id))
      toast.success("Tag deleted")
      setDeleteTag(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tag")
    } finally {
      setDeleting(false)
    }
  }

  const TagFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-zinc-300">Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Tag name"
          className="bg-zinc-700 border-zinc-600 text-zinc-100"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Collection</Label>
        <Select
          value={form.collectionId}
          onValueChange={(v) => setForm((f) => ({ ...f, collectionId: v ?? "__global__" }))}
        >
          <SelectTrigger className="w-full bg-zinc-700 border-zinc-600 text-zinc-200">
            <SelectValue>
              {(value: string) => {
                if (value === "__global__") return "Global (all collections)"
                const col = collections.find((c) => c.id === value)
                if (!col) return "Select collection"
                return <>{col.icon && <span className="mr-1">{col.icon}</span>}{col.name}</>
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="__global__" className="text-zinc-200">Global (all collections)</SelectItem>
            {collections.map((col) => (
              <SelectItem key={col.id} value={col.id} className="text-zinc-200">
                {col.icon} {col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Color</Label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: f.color === c ? "" : c }))}
              className="size-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: form.color === c ? "white" : "transparent",
              }}
            />
          ))}
        </div>
        <div className="flex gap-2 items-center mt-2">
          <input
            type="color"
            value={form.color || "#6b7280"}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="size-8 rounded cursor-pointer bg-transparent border-0"
          />
          <Input
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            placeholder="#hex or empty"
            className="bg-zinc-700 border-zinc-600 text-zinc-100 h-7 text-xs"
          />
        </div>
      </div>
    </div>
  )

  // Group tags by collection
  const globalTags = tags.filter((t) => !t.collectionId)
  const tagsByCollection = collections.map((col) => ({
    collection: col,
    tags: tags.filter((t) => t.collectionId === col.id),
  })).filter((g) => g.tags.length > 0)

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={<Button size="sm" className="gap-1.5" onClick={openCreate} />}
          >
            <PlusIcon className="size-4" />
            New tag
          </DialogTrigger>
          <DialogContent className="bg-zinc-800 border-zinc-700 max-w-sm">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-zinc-100">Create tag</h2>
              <TagFormFields />
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

      {tags.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <TagIcon className="size-10 mx-auto mb-2 opacity-50" />
          <p>No tags yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {globalTags.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Global
              </h2>
              <TagList
                tags={globalTags}
                onEdit={openEdit}
                onDelete={setDeleteTag}
              />
            </section>
          )}
          {tagsByCollection.map(({ collection, tags: ctags }) => (
            <section key={collection.id}>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                {collection.icon} {collection.name}
              </h2>
              <TagList
                tags={ctags}
                onEdit={openEdit}
                onDelete={setDeleteTag}
              />
            </section>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTag} onOpenChange={(o) => { if (!o) setEditTag(null) }}>
        <DialogContent className="bg-zinc-800 border-zinc-700 max-w-sm">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-100">Edit tag</h2>
            <TagFormFields />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditTag(null)}
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
      <Dialog open={!!deleteTag} onOpenChange={(o) => { if (!o) setDeleteTag(null) }}>
        <DialogContent className="bg-zinc-800 border-zinc-700 max-w-sm">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-100">Delete tag?</h2>
            <p className="text-sm text-zinc-400">
              Delete <strong className="text-zinc-200">{deleteTag?.name}</strong>?
              It will be removed from {deleteTag?._count.items} item{deleteTag?._count.items !== 1 ? "s" : ""}.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTag(null)}
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

function TagList({
  tags,
  onEdit,
  onDelete,
}: {
  tags: TagWithRelations[]
  onEdit: (tag: TagWithRelations) => void
  onDelete: (tag: TagWithRelations) => void
}) {
  return (
    <div className="space-y-2">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
        >
          {tag.color ? (
            <span
              className="size-4 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
          ) : (
            <TagIcon className="size-4 text-zinc-500 shrink-0" />
          )}
          <span
            className="flex-1 text-sm font-medium text-zinc-200"
            style={tag.color ? { color: tag.color } : undefined}
          >
            {tag.name}
          </span>
          <span className="text-xs text-zinc-500 tabular-nums">
            {tag._count.items} item{tag._count.items !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(tag)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(tag)}
              className="text-zinc-400 hover:text-red-400"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
