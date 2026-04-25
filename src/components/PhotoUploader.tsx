"use client"

import { useState, useRef, useCallback } from "react"
import type { Photo } from "@prisma/client"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { UploadCloudIcon, XIcon, StarIcon, GripVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PhotoUploaderProps {
  itemId: string
  initialPhotos?: Photo[]
  onChange?: (photos: Photo[]) => void
}

interface UploadingFile {
  id: string
  name: string
  progress: number
}

function SortablePhoto({
  photo,
  onDelete,
  onSetPrimary,
}: {
  photo: Photo
  onDelete: (id: string) => void
  onSetPrimary: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-square rounded-lg overflow-hidden border-2 bg-zinc-700",
        photo.isPrimary ? "border-yellow-400" : "border-zinc-600",
        isDragging && "opacity-50 z-50"
      )}
    >
      <img
        src={`/api/uploads/${photo.filename}`}
        alt="Photo"
        className="w-full h-full object-cover"
      />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 size-6 rounded bg-black/50 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVerticalIcon className="size-3.5 text-white" />
      </div>

      {/* Primary badge */}
      {photo.isPrimary && (
        <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5">
          <StarIcon className="size-3 text-yellow-900 fill-yellow-900" />
        </div>
      )}

      {/* Actions */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        {!photo.isPrimary && (
          <button
            onClick={() => onSetPrimary(photo.id)}
            className="size-7 rounded bg-yellow-500/80 hover:bg-yellow-500 flex items-center justify-center"
            title="Set as primary"
          >
            <StarIcon className="size-3.5 text-white" />
          </button>
        )}
        <button
          onClick={() => onDelete(photo.id)}
          className="size-7 rounded bg-red-500/80 hover:bg-red-500 flex items-center justify-center"
          title="Delete photo"
        >
          <XIcon className="size-3.5 text-white" />
        </button>
      </div>
    </div>
  )
}

export function PhotoUploader({ itemId, initialPhotos = [], onChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  const uploadFile = async (file: File) => {
    const tempId = `${Date.now()}-${Math.random()}`
    setUploading((prev) => [...prev, { id: tempId, name: file.name, progress: 0 }])

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/items/${itemId}/photos`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Upload failed")
      }
      const photo: Photo = await res.json()
      setPhotos((prev) => {
        const next = [...prev, photo]
        onChange?.(next)
        return next
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading((prev) => prev.filter((u) => u.id !== tempId))
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`)
        return
      }
      uploadFile(file)
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDelete = async (photoId: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}/photos/${photoId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      setPhotos((prev) => {
        const next = prev.filter((p) => p.id !== photoId)
        onChange?.(next)
        return next
      })
    } catch {
      toast.error("Failed to delete photo")
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      })
      if (!res.ok) throw new Error("Failed to update")
      setPhotos((prev) => {
        const next = prev.map((p) => ({ ...p, isPrimary: p.id === photoId }))
        onChange?.(next)
        return next
      })
    } catch {
      toast.error("Failed to set primary photo")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex((p) => p.id === active.id)
    const newIndex = photos.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(photos, oldIndex, newIndex)
    setPhotos(reordered)
    onChange?.(reordered)

    try {
      await fetch(`/api/items/${itemId}/photos/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
      })
    } catch {
      toast.error("Failed to save order")
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors",
          isDragOver
            ? "border-zinc-400 bg-zinc-700/50"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50"
        )}
      >
        <UploadCloudIcon className="size-8 text-zinc-400" />
        <div className="text-center">
          <p className="text-sm text-zinc-300">Drop images here or click to upload</p>
          <p className="text-xs text-zinc-500 mt-0.5">PNG, JPG, WEBP supported</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Uploading indicators */}
      {uploading.map((u) => (
        <div key={u.id} className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2">
          <div className="size-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
          <span className="truncate">{u.name}</span>
        </div>
      ))}

      {/* Photo grid */}
      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  onDelete={handleDelete}
                  onSetPrimary={handleSetPrimary}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
