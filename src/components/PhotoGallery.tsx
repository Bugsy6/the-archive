"use client"

import { useState } from "react"
import type { Photo } from "@prisma/client"
import { PackageIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PhotoGalleryProps {
  photos: Photo[]
  title: string
}

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (photos.length === 0) {
    return (
      <div className="aspect-square bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <PackageIcon className="size-12" />
          <span className="text-sm">No photos</span>
        </div>
      </div>
    )
  }

  const activePhoto = photos[activeIndex]

  const prev = () => setActiveIndex((i) => (i - 1 + photos.length) % photos.length)
  const next = () => setActiveIndex((i) => (i + 1) % photos.length)

  return (
    <>
      {/* Main image */}
      <div className="space-y-3">
        <div
          className="aspect-square bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 cursor-zoom-in relative group"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={`/api/uploads/${activePhoto.filename}`}
            alt={title}
            className="w-full h-full object-contain"
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeftIcon className="size-4 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRightIcon className="size-4 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "size-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors",
                  index === activeIndex
                    ? "border-zinc-400"
                    : "border-zinc-700 hover:border-zinc-500"
                )}
              >
                <img
                  src={`/api/uploads/${photo.filename}`}
                  alt={`${title} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setLightboxOpen(false)}
          >
            <XIcon className="size-5" />
          </Button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <ChevronLeftIcon className="size-5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <ChevronRightIcon className="size-5 text-white" />
              </button>
            </>
          )}

          <img
            src={`/api/uploads/${activePhoto.filename}`}
            alt={title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}
