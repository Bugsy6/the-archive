import { prisma } from "@/lib/prisma"
import { CollectionsManager } from "@/components/CollectionsManager"

export const dynamic = "force-dynamic"

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  })

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Collections</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your collections</p>
      </div>
      <CollectionsManager initialCollections={collections} />
    </div>
  )
}
