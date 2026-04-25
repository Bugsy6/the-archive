import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/types"
import { ItemStatus } from "@prisma/client"
import { PackageIcon, ArchiveIcon } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [collections, recentItems, statusCounts] = await Promise.all([
    prisma.collection.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.item.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        collection: true,
        photos: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.item.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ])

  const totalItems = collections.reduce((sum, c) => sum + c._count.items, 0)

  const statusCountMap: Partial<Record<ItemStatus, number>> = {}
  for (const s of statusCounts) {
    statusCountMap[s.status as ItemStatus] = s._count._all
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
          <ArchiveIcon className="size-8 text-zinc-400" />
          Dashboard
        </h1>
        <p className="text-zinc-400 mt-1">Overview of your collection</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-400 text-sm font-normal">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{totalItems}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-400 text-sm font-normal">Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{collections.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-400 text-sm font-normal">Owned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              {statusCountMap.OWNED ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-400 text-sm font-normal">Wishlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">
              {statusCountMap.WISHLIST ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection breakdown */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-zinc-200 mb-3">Collections</h2>
          <div className="space-y-2">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/${col.slug}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-colors"
              >
                <span className="text-xl">{col.icon ?? "📦"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate">{col.name}</div>
                </div>
                <span className="text-sm text-zinc-400 tabular-nums">{col._count.items}</span>
              </Link>
            ))}
            {collections.length === 0 && (
              <p className="text-zinc-500 text-sm px-3">No collections yet.</p>
            )}
          </div>

          {/* Status breakdown */}
          <h2 className="text-lg font-semibold text-zinc-200 mt-6 mb-3">By Status</h2>
          <div className="space-y-2">
            {(Object.keys(STATUS_LABELS) as ItemStatus[]).map((status) => {
              const count = statusCountMap[status] ?? 0
              if (count === 0) return null
              return (
                <div
                  key={status}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800 border border-zinc-700"
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-sm text-zinc-300 tabular-nums font-medium">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent items */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-zinc-200 mb-3">Recently Added</h2>
          <div className="space-y-2">
            {recentItems.map((item) => {
              const photo = item.photos[0]
              return (
                <Link
                  key={item.id}
                  href={`/${item.collection.slug}/${item.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="size-12 shrink-0 rounded-md overflow-hidden bg-zinc-700 flex items-center justify-center">
                    {photo ? (
                      <img
                        src={`/api/uploads/${photo.filename}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PackageIcon className="size-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-200 truncate">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-xs text-zinc-500 truncate">{item.subtitle}</div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500">{item.collection.name}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs shrink-0 ${STATUS_COLORS[item.status as ItemStatus]}`}>
                    {STATUS_LABELS[item.status as ItemStatus]}
                  </Badge>
                </Link>
              )
            })}
            {recentItems.length === 0 && (
              <p className="text-zinc-500 text-sm px-3">No items yet. Add some items to get started.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
