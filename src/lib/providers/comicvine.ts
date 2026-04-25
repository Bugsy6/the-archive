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

function mapIssue(issue: Record<string, unknown>): SearchResult {
  const volume = issue.volume as { name?: string } | undefined
  const image = issue.image as { medium_url?: string; original_url?: string } | undefined

  return {
    externalId: String(issue.id),
    externalSource: "comicvine",
    externalUrl: issue.site_detail_url as string | undefined,
    title: issue.name as string ?? `${volume?.name ?? "Unknown"} #${issue.issue_number}`,
    subtitle: volume?.name
      ? `${volume.name} #${issue.issue_number}`
      : `Issue #${issue.issue_number}`,
    description: issue.description as string | undefined,
    coverUrl: image?.medium_url ?? image?.original_url,
    metadata: {
      issueNumber: issue.issue_number,
      volume: volume?.name,
      coverDate: issue.cover_date,
    },
  }
}

export const comicVineProvider: MetadataProvider = {
  source: "comicvine",
  collectionSlugs: ["comics"],

  async search(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.COMICVINE_API_KEY
    if (!apiKey) return []

    try {
      const res = await fetchWithTimeout(
        `https://comicvine.gamespot.com/api/search/?api_key=${apiKey}&format=json&resources=issue&query=${encodeURIComponent(query)}&field_list=id,name,issue_number,volume,description,image,site_detail_url&limit=10`
      )

      if (!res.ok) return []

      const data = await res.json()
      const results = data.results as Array<Record<string, unknown>> | undefined
      if (!results) return []

      return results.map(mapIssue)
    } catch {
      return []
    }
  },

  async getById(id: string): Promise<SearchResult | null> {
    const apiKey = process.env.COMICVINE_API_KEY
    if (!apiKey) return null

    try {
      const res = await fetchWithTimeout(
        `https://comicvine.gamespot.com/api/issue/4000-${id}/?api_key=${apiKey}&format=json&field_list=id,name,issue_number,volume,description,image,site_detail_url,cover_date`
      )

      if (!res.ok) return null

      const data = await res.json()
      const issue = data.results as Record<string, unknown>
      if (!issue) return null

      return mapIssue(issue)
    } catch {
      return null
    }
  },
}
