"use client"

import Link from "next/link"
import { PackageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, STATUS_COLORS, CONDITION_LABELS } from "@/lib/types"
import type { ItemWithRelations } from "@/lib/types"
import { ItemStatus, Condition } from "@prisma/client"
import { cn } from "@/lib/utils"

interface ItemCardProps {
  item: ItemWithRelations
}

export function ItemCard({ item }: ItemCardProps) {
  const primaryPhoto = item.photos.find((p) => p.isPrimary) ?? item.photos[0]
  const status = item.status as ItemStatus
  const condition = item.condition as Condition | null

  return (
    <Link
      href={`/${item.collection.slug}/${item.id}`}
      className="group flex flex-col bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-colors"
    >
      {/* Photo */}
      <div className="aspect-square bg-zinc-700 relative overflow-hidden">
        {primaryPhoto ? (
          <img
            src={`/api/uploads/${primaryPhoto.filename}`}
            alt={item.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PackageIcon className="size-10 text-zinc-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="font-medium text-zinc-100 text-sm leading-snug line-clamp-2">
          {item.title}
        </div>
        {item.subtitle && (
          <div className="text-xs text-zinc-400 line-clamp-1">{item.subtitle}</div>
        )}

        <div className="flex flex-wrap gap-1 mt-auto pt-1.5">
          <span
            className={cn(
              "inline-flex items-center text-xs px-1.5 py-0.5 rounded-full font-medium",
              STATUS_COLORS[status]
            )}
          >
            {STATUS_LABELS[status]}
          </span>
          {condition && (
            <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full font-medium bg-zinc-700 text-zinc-300">
              {CONDITION_LABELS[condition]}
            </span>
          )}
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map(({ tag }) => (
              <span
                key={tag.id}
                className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400"
                style={tag.color ? { backgroundColor: `${tag.color}30`, color: tag.color } : undefined}
              >
                {tag.name}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-zinc-500">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
