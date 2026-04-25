import { prisma } from "@/lib/prisma"
import { TagsManager } from "@/components/TagsManager"

export const dynamic = "force-dynamic"

export default async function TagsPage() {
  const [tags, collections] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        collection: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Tags</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage tags across your collections</p>
      </div>
      <TagsManager initialTags={tags as Parameters<typeof TagsManager>[0]["initialTags"]} collections={collections} />
    </div>
  )
}
