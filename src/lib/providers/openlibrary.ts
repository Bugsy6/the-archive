import type { MetadataProvider, SearchResult } from "./types"

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

export const openLibraryProvider: MetadataProvider = {
  source: "openlibrary",
  collectionSlugs: ["books"],

  async search(query: string): Promise<SearchResult[]> {
    try {
      const res = await fetchWithTimeout(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`
      )

      if (!res.ok) return []

      const data = await res.json()
      const docs = data.docs as Array<Record<string, unknown>>

      return docs.map((doc) => {
        const coverId = doc.cover_i as number | undefined
        const isbns = doc.isbn as string[] | undefined
        const authors = doc.author_name as string[] | undefined
        const publishers = doc.publisher as string[] | undefined
        const workKey = doc.key as string | undefined

        return {
          externalId: workKey ? workKey.replace("/works/", "") : String(doc.key),
          externalSource: "openlibrary",
          externalUrl: workKey ? `https://openlibrary.org${workKey}` : undefined,
          title: doc.title as string,
          subtitle: authors?.[0],
          coverUrl: coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : undefined,
          metadata: {
            isbn: isbns?.[0],
            author: authors?.[0],
            year: doc.first_publish_year,
            publisher: publishers?.[0],
          },
        }
      })
    } catch {
      return []
    }
  },

  async getById(id: string): Promise<SearchResult | null> {
    try {
      const res = await fetchWithTimeout(
        `https://openlibrary.org/works/${id}.json`
      )

      if (!res.ok) return null

      const data = await res.json()
      const covers = data.covers as number[] | undefined
      const description = data.description

      return {
        externalId: id,
        externalSource: "openlibrary",
        externalUrl: `https://openlibrary.org/works/${id}`,
        title: data.title as string,
        description:
          typeof description === "string"
            ? description
            : (description?.value as string | undefined),
        coverUrl: covers?.[0]
          ? `https://covers.openlibrary.org/b/id/${covers[0]}-L.jpg`
          : undefined,
        metadata: {},
      }
    } catch {
      return null
    }
  },
}
