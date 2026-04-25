"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

interface DeleteItemButtonProps {
  itemId: string
  collectionSlug: string
}

export function DeleteItemButton({ itemId, collectionSlug }: DeleteItemButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to delete")
      }
      toast.success("Item deleted")
      setOpen(false)
      router.push(`/${collectionSlug}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm" className="gap-1.5" />
        }
      >
        <Trash2Icon className="size-3.5" />
        Delete
      </DialogTrigger>
      <DialogContent className="bg-zinc-800 border-zinc-700 max-w-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Delete item?</h2>
            <p className="text-sm text-zinc-400 mt-1">
              This will permanently delete the item and all its photos. This cannot be undone.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="border-zinc-700"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
