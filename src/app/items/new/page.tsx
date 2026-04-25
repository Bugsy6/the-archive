import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ItemForm } from "@/components/ItemForm"
import { ChevronLeftIcon } from "lucide-react"

export const dynamic = "force-dynamic"

interface NewItemPageProps {
  searchParams: Promise<{ collection?: string }>
}

export default async function NewItemPage({ searchParams }: NewItemPageProps) {
  const { collection: collectionSlug } = await searchParams

  const [collections, tags] = await Promise.all([
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ])

  // Find collection by slug if provided
  const defaultCollection = collectionSlug
    ? collections.find((c) => c.slug === collectionSlug)
    : collections[0]

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-zinc-400">
        <Link
          href={defaultCollection ? `/${defaultCollection.slug}` : "/"}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeftIcon className="size-4" />
          {defaultCollection ? defaultCollection.name : "Dashboard"}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-zinc-100 mb-6">New item</h1>

      {collections.length === 0 ? (
        <div className="text-zinc-400">
          <p>No collections yet.</p>
          <Link href="/collections" className="text-blue-400 hover:underline mt-2 inline-block">
            Create a collection first
          </Link>
        </div>
      ) : (
        <ItemForm
          mode="create"
          collectionId={defaultCollection?.id}
          collections={collections}
          tags={tags}
        />
      )}
    </div>
  )
}
