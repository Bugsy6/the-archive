import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ItemForm } from "@/components/ItemForm"
import { ChevronLeftIcon } from "lucide-react"
import { ItemStatus, Condition } from "@prisma/client"

export const dynamic = "force-dynamic"

interface EditPageProps {
  params: Promise<{ collection: string; id: string }>
}

export default async function EditItemPage({ params }: EditPageProps) {
  const { collection: slug, id } = await params

  const [item, collections, tags] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: {
        collection: true,
        photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        tags: { include: { tag: true } },
      },
    }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ])

  if (!item || item.collection.slug !== slug) notFound()

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-zinc-400">
        <Link
          href={`/${slug}/${id}`}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeftIcon className="size-4" />
          Back to item
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Edit item</h1>

      <ItemForm
        mode="edit"
        itemId={item.id}
        collectionId={item.collectionId}
        collections={collections}
        tags={tags}
        initialPhotos={item.photos}
        initialValues={{
          title: item.title,
          subtitle: item.subtitle ?? undefined,
          description: item.description ?? undefined,
          notes: item.notes ?? undefined,
          collectionId: item.collectionId,
          status: item.status as ItemStatus,
          condition: (item.condition ?? Condition.GOOD) as Condition,
          acquiredAt: item.acquiredAt?.toISOString(),
          acquiredFrom: item.acquiredFrom ?? undefined,
          pricePaid: item.pricePaid,
          externalUrl: item.externalUrl ?? undefined,
          externalSource: item.externalSource ?? undefined,
          externalId: item.externalId ?? undefined,
          tagIds: item.tags.map((t) => t.tagId),
        }}
      />
    </div>
  )
}
