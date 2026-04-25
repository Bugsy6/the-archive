import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PhotoGallery } from "@/components/PhotoGallery"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CONDITION_LABELS,
} from "@/lib/types"
import { ItemStatus, Condition } from "@prisma/client"
import { PencilIcon, ExternalLinkIcon, ChevronLeftIcon } from "lucide-react"
import { DeleteItemButton } from "@/components/DeleteItemButton"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface ItemPageProps {
  params: Promise<{ collection: string; id: string }>
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { collection: slug, id } = await params

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      collection: true,
      photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      tags: { include: { tag: true } },
    },
  })

  if (!item || item.collection.slug !== slug) notFound()

  const status = item.status as ItemStatus
  const condition = item.condition as Condition | null

  const metadata = item.metadata
    ? (() => { try { return JSON.parse(item.metadata) } catch { return null } })()
    : null

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-zinc-400">
        <Link href={`/${slug}`} className="flex items-center gap-1 hover:text-zinc-200 transition-colors">
          <ChevronLeftIcon className="size-4" />
          {item.collection.name}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Photos */}
        <div>
          <PhotoGallery photos={item.photos} title={item.title} />
        </div>

        {/* Right: Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 leading-tight">{item.title}</h1>
                {item.subtitle && (
                  <p className="text-zinc-400 mt-1">{item.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/${slug}/${id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-1.5 border-zinc-700">
                    <PencilIcon className="size-3.5" />
                    Edit
                  </Button>
                </Link>
                <DeleteItemButton itemId={id} collectionSlug={slug} />
              </div>
            </div>
          </div>

          {/* Status & Condition */}
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium",
                STATUS_COLORS[status]
              )}
            >
              {STATUS_LABELS[status]}
            </span>
            {condition && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-zinc-700 text-zinc-300">
                {CONDITION_LABELS[condition]}
              </span>
            )}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300"
                  style={tag.color ? { backgroundColor: `${tag.color}30`, color: tag.color } : undefined}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <Separator className="bg-zinc-700" />

          {/* Description */}
          {item.description && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Description</h3>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Acquisition info */}
          {(item.acquiredAt || item.acquiredFrom || item.pricePaid) && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Acquisition</h3>
              <dl className="space-y-1.5">
                {item.acquiredAt && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-zinc-500">Date</dt>
                    <dd className="text-zinc-300">{new Date(item.acquiredAt).toLocaleDateString()}</dd>
                  </div>
                )}
                {item.acquiredFrom && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-zinc-500">From</dt>
                    <dd className="text-zinc-300">{item.acquiredFrom}</dd>
                  </div>
                )}
                {item.pricePaid != null && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-zinc-500">Price paid</dt>
                    <dd className="text-zinc-300">${item.pricePaid.toFixed(2)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Notes</h3>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* External metadata */}
          {metadata && typeof metadata === "object" && Object.keys(metadata).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Details</h3>
              <dl className="space-y-1.5">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm gap-4">
                    <dt className="text-zinc-500 shrink-0 capitalize">{key.replace(/_/g, " ")}</dt>
                    <dd className="text-zinc-300 text-right">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* External link */}
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLinkIcon className="size-3.5" />
              {item.externalSource ?? "View source"}
            </a>
          )}

          {/* Timestamps */}
          <div className="pt-2 border-t border-zinc-700 space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Added</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Updated</span>
              <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
