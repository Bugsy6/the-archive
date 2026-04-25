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

function mapVolume(item: Record<string, unknown>): SearchResult {
  const volumeInfo = item.volumeInfo as Record<string, unknown> | undefined
  const imageLinks = volumeInfo?.imageLinks as Record<string, string> | undefined
  const identifiers = volumeInfo?.industryIdentifiers as Array<{
    type: string
    identifier: string
  }> | undefined
  const authors = volumeInfo?.authors as string[] | undefined

  let coverUrl = imageLinks?.thumbnail
  if (coverUrl?.startsWith("http:")) {
    coverUrl = "https:" + coverUrl.slice(5)
  }

  return {
    externalId: item.id as string,
    externalSource: "googlebooks",
    externalUrl: volumeInfo?.infoLink as string | undefined,
    title: volumeInfo?.title as string,
    subtitle: authors?.[0],
    description: volumeInfo?.description as string | undefined,
    coverUrl,
    metadata: {
      isbn: identifiers?.[0]?.identifier,
      author: authors?.[0],
      year: volumeInfo?.publishedDate,
      publisher: volumeInfo?.publisher,
      pageCount: volumeInfo?.pageCount,
    },
  }
}

export const googleBooksProvider: MetadataProvider = {
  source: "googlebooks",
  collectionSlugs: ["books"],

  async search(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY
    if (!apiKey) return []

    try {
      const res = await fetchWithTimeout(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`
      )

      if (!res.ok) return []

      const data = await res.json()
      const items = data.items as Array<Record<string, unknown>> | undefined
      if (!items) return []

      return items.map(mapVolume)
    } catch {
      return []
    }
  },

  async getById(id: string): Promise<SearchResult | null> {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY
    if (!apiKey) return null

    try {
      const res = await fetchWithTimeout(
        `https://www.googleapis.com/books/v1/volumes/${id}?key=${apiKey}`
      )

      if (!res.ok) return null

      const data = await res.json()
      return mapVolume(data as Record<string, unknown>)
    } catch {
      return null
    }
  },
}
