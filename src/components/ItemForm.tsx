"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { PhotoUploader } from "@/components/PhotoUploader"
import { ExternalSearchModal, type ExternalSearchResult } from "@/components/ExternalSearchModal"
import { STATUS_LABELS, CONDITION_LABELS } from "@/lib/types"
import { ItemStatus, Condition } from "@prisma/client"
import type { Collection, Tag, Photo } from "@prisma/client"
import { toast } from "sonner"

interface ItemFormProps {
  mode: "create" | "edit"
  itemId?: string
  collectionId?: string
  collections: Collection[]
  tags: Tag[]
  initialPhotos?: Photo[]
  initialValues?: {
    title?: string
    subtitle?: string
    description?: string
    notes?: string
    collectionId?: string
    status?: ItemStatus
    condition?: Condition
    acquiredAt?: string
    acquiredFrom?: string
    pricePaid?: number | null
    externalUrl?: string
    externalSource?: string
    externalId?: string
    tagIds?: string[]
  }
}

export function ItemForm({
  mode,
  itemId,
  collectionId: defaultCollectionId,
  collections,
  tags,
  initialPhotos = [],
  initialValues = {},
}: ItemFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState(initialValues.title ?? "")
  const [subtitle, setSubtitle] = useState(initialValues.subtitle ?? "")
  const [description, setDescription] = useState(initialValues.description ?? "")
  const [notes, setNotes] = useState(initialValues.notes ?? "")
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    initialValues.collectionId ?? defaultCollectionId ?? collections[0]?.id ?? ""
  )
  const [status, setStatus] = useState<ItemStatus>(initialValues.status ?? ItemStatus.OWNED)
  const [condition, setCondition] = useState<Condition>(initialValues.condition ?? Condition.GOOD)
  const [acquiredAt, setAcquiredAt] = useState(
    initialValues.acquiredAt
      ? new Date(initialValues.acquiredAt).toISOString().split("T")[0]
      : ""
  )
  const [acquiredFrom, setAcquiredFrom] = useState(initialValues.acquiredFrom ?? "")
  const [pricePaid, setPricePaid] = useState(
    initialValues.pricePaid != null ? String(initialValues.pricePaid) : ""
  )
  const [externalUrl, setExternalUrl] = useState(initialValues.externalUrl ?? "")
  const [externalSource, setExternalSource] = useState(initialValues.externalSource ?? "")
  const [externalId, setExternalId] = useState(initialValues.externalId ?? "")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialValues.tagIds ?? [])

  // Available tags for the selected collection (+ global tags)
  const availableTags = tags.filter(
    (t) => t.collectionId === selectedCollectionId || t.collectionId === null
  )

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleExternalSelect = (result: ExternalSearchResult) => {
    if (result.title) setTitle(result.title)
    if (result.subtitle) setSubtitle(result.subtitle)
    if (result.description) setDescription(result.description)
    if (result.externalUrl) setExternalUrl(result.externalUrl)
    if (result.externalSource) setExternalSource(result.externalSource)
    if (result.externalId) setExternalId(result.externalId)
  }

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!selectedCollectionId) {
      toast.error("Collection is required")
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        notes: notes.trim() || null,
        collectionId: selectedCollectionId,
        status,
        condition,
        acquiredAt: acquiredAt || null,
        acquiredFrom: acquiredFrom.trim() || null,
        pricePaid: pricePaid ? parseFloat(pricePaid) : null,
        externalUrl: externalUrl.trim() || null,
        externalSource: externalSource.trim() || null,
        externalId: externalId.trim() || null,
        tagIds: selectedTagIds,
      }

      const url = mode === "create" ? "/api/items" : `/api/items/${itemId}`
      const method = mode === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to save")
      }

      const saved = await res.json()
      toast.success(mode === "create" ? "Item created" : "Item saved")

      const collSlug = selectedCollection?.slug ?? saved.collection?.slug
      router.push(`/${collSlug}/${saved.id}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* External search */}
      <div className="flex justify-end">
        <ExternalSearchModal
          collectionSlug={selectedCollection?.slug}
          onSelect={handleExternalSelect}
        />
      </div>

      {/* Basic info */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-zinc-300">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item title"
            required
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subtitle" className="text-zinc-300">Subtitle</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Optional subtitle"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-zinc-300">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Item description"
            rows={3}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-zinc-300">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes"
            rows={2}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none"
          />
        </div>
      </div>

      <Separator className="bg-zinc-700" />

      {/* Collection, Status, Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Collection *</Label>
          <Select value={selectedCollectionId} onValueChange={(v) => setSelectedCollectionId(v ?? "")}>
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-200">
              <SelectValue placeholder="Select collection">
                {(value: string) => {
                  const col = collections.find((c) => c.id === value)
                  if (!col) return "Select collection"
                  return <>{col.icon && <span className="mr-1">{col.icon}</span>}{col.name}</>
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {collections.map((col) => (
                <SelectItem key={col.id} value={col.id} className="text-zinc-200">
                  {col.icon && <span className="mr-1">{col.icon}</span>}
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus)}>
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {Object.values(ItemStatus).map((s) => (
                <SelectItem key={s} value={s} className="text-zinc-200">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Condition</Label>
          <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {Object.values(Condition).map((c) => (
                <SelectItem key={c} value={c} className="text-zinc-200">
                  {CONDITION_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-zinc-700" />

      {/* Tags */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-zinc-300">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-1.5 cursor-pointer text-sm text-zinc-300"
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={() => toggleTag(tag.id)}
                />
                <span style={tag.color ? { color: tag.color } : undefined}>{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-zinc-700" />

      {/* Acquisition */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-300">Acquisition</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="acquiredAt" className="text-zinc-300">Date acquired</Label>
            <Input
              id="acquiredAt"
              type="date"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acquiredFrom" className="text-zinc-300">Acquired from</Label>
            <Input
              id="acquiredFrom"
              value={acquiredFrom}
              onChange={(e) => setAcquiredFrom(e.target.value)}
              placeholder="Store, seller, etc."
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pricePaid" className="text-zinc-300">Price paid</Label>
            <Input
              id="pricePaid"
              type="number"
              step="0.01"
              min="0"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              placeholder="0.00"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-700" />

      {/* External link */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-300">External reference</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="externalUrl" className="text-zinc-300">URL</Label>
            <Input
              id="externalUrl"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="externalSource" className="text-zinc-300">Source</Label>
            <Input
              id="externalSource"
              value={externalSource}
              onChange={(e) => setExternalSource(e.target.value)}
              placeholder="e.g. Discogs, IMDB"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Photos (only for edit mode where we have an itemId) */}
      {mode === "edit" && itemId && (
        <>
          <Separator className="bg-zinc-700" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-300">Photos</h3>
            <PhotoUploader itemId={itemId} initialPhotos={initialPhotos} />
          </div>
        </>
      )}

      {mode === "create" && (
        <p className="text-xs text-zinc-500">
          You can add photos after creating the item.
        </p>
      )}

      <Separator className="bg-zinc-700" />

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="min-w-24"
        >
          {loading ? "Saving..." : mode === "create" ? "Create item" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="border-zinc-700 text-zinc-300"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
