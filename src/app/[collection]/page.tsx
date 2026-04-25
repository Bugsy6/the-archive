import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ItemCard } from "@/components/ItemCard"
import { FilterSidebar } from "@/components/FilterSidebar"
import { Button } from "@/components/ui/button"
import { PlusIcon, UploadIcon } from "lucide-react"
import { Suspense } from "react"
import { ItemStatus, Condition } from "@prisma/client"
import type { ItemWithRelations } from "@/lib/types"

export const dynamic = "force-dynamic"

interface CollectionPageProps {
  params: Promise<{ collection: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { collection: slug } = await params
  const sp = await searchParams

  const getString = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v ?? ""

  const statusParam = getString(sp.status)
  const conditionParam = getString(sp.condition)
  const tagsParam = getString(sp.tags)
  const searchParam = getString(sp.search)
  const sortParam = getString(sp.sort) || "createdAt_desc"
  const pageParam = parseInt(getString(sp.page) || "1", 10)
  const limit = 24

  const collection = await prisma.collection.findUnique({
    where: { slug },
  })
  if (!collection) notFound()

  const [sortField, sortDir] = sortParam.split("_") as [string, "asc" | "desc"]

  const where: Record<string, unknown> = { collectionId: collection.id }
  if (statusParam) where.status = statusParam as ItemStatus
  if (conditionParam) where.condition = conditionParam as Condition
  if (searchParam) {
    where.OR = [
      { title: { contains: searchParam } },
      { subtitle: { contains: searchParam } },
      { description: { contains: searchParam } },
    ]
  }
  if (tagsParam) {
    const tagIds = tagsParam.split(",").filter(Boolean)
    if (tagIds.length > 0) {
      where.tags = { some: { tagId: { in: tagIds } } }
    }
  }

  const validSortFields = ["title", "createdAt", "updatedAt", "acquiredAt"]
  const orderBy: Record<string, unknown> = validSortFields.includes(sortField)
    ? { [sortField]: sortDir ?? "asc" }
    : { createdAt: "desc" }

  const [items, total, tags] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy,
      skip: (pageParam - 1) * limit,
      take: limit,
      include: {
        collection: true,
        photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        tags: { include: { tag: true } },
      },
    }),
    prisma.item.count({ where }),
    prisma.tag.findMany({
      where: { collectionId: collection.id },
      orderBy: { name: "asc" },
    }),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {collection.icon && <span className="text-3xl">{collection.icon}</span>}
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-zinc-400 mt-0.5">{collection.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${collection.slug}/import`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <UploadIcon className="size-4" />
              Import CSV
            </Button>
          </Link>
          <Link href="/items/new">
            <Button size="sm" className="gap-1.5">
              <PlusIcon className="size-4" />
              Add item
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar - needs Suspense for useSearchParams */}
        <Suspense>
          <FilterSidebar tags={tags} collectionSlug={slug} />
        </Suspense>

        {/* Items grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-zinc-400">
              {total} item{total !== 1 ? "s" : ""}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-lg">No items found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {(items as ItemWithRelations[]).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {pageParam > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(
                    Object.entries(sp)
                      .filter(([, v]) => v !== undefined)
                      .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ""])
                  ).entries()), page: String(pageParam - 1) })}`}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-zinc-400">
                Page {pageParam} of {pages}
              </span>
              {pageParam < pages && (
                <Link
                  href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(
                    Object.entries(sp)
                      .filter(([, v]) => v !== undefined)
                      .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ""])
                  ).entries()), page: String(pageParam + 1) })}`}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
