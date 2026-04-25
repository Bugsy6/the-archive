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

function getXmlAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i")
  const m = xml.match(re)
  return m ? m[1] : null
}

function getAllMatches(xml: string, pattern: RegExp): RegExpMatchArray[] {
  const results: RegExpMatchArray[] = []
  let m
  const re = new RegExp(pattern.source, "gi")
  while ((m = re.exec(xml)) !== null) results.push(m)
  return results
}

function getXmlText(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  const m = xml.match(re)
  if (!m) return null
  // Strip HTML entities and tags
  return m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#10;/g, "\n").trim()
}

export const bggProvider: MetadataProvider = {
  source: "bgg",
  collectionSlugs: ["board-games"],

  async search(query: string): Promise<SearchResult[]> {
    try {
      const res = await fetchWithTimeout(
        `https://api.geekdo.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
      )

      if (!res.ok) return []

      const xml = await res.text()

      // Match each <item> block
      const itemMatches = getAllMatches(xml, /<item[^>]*type="boardgame"[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/)

      return itemMatches.map((m) => {
        const id = m[1]
        const block = m[2]

        // Get primary name
        const nameMatch = block.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/)
        const title = nameMatch ? nameMatch[1] : "Unknown"

        // Get year
        const yearMatch = block.match(/<yearpublished[^>]*value="([^"]*)"/)
        const year = yearMatch ? yearMatch[1] : undefined

        return {
          externalId: id,
          externalSource: "bgg",
          externalUrl: `https://boardgamegeek.com/boardgame/${id}`,
          title,
          subtitle: year,
        }
      })
    } catch {
      return []
    }
  },

  async getById(id: string): Promise<SearchResult | null> {
    try {
      const res = await fetchWithTimeout(
        `https://api.geekdo.com/xmlapi2/thing?id=${id}&stats=1`
      )

      if (!res.ok) return null

      const xml = await res.text()

      // Primary name
      const nameMatch = xml.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/)
      const title = nameMatch ? nameMatch[1] : "Unknown"

      // Description
      const description = getXmlText(xml, "description")

      // Thumbnail and image
      const thumbnail = getXmlText(xml, "thumbnail")
      const image = getXmlText(xml, "image")
      const coverUrl = image || thumbnail || undefined

      // Stats
      const ratingAvg = getXmlAttr(xml, "average", "value")
      const minPlayers = getXmlAttr(xml, "minplayers", "value")
      const maxPlayers = getXmlAttr(xml, "maxplayers", "value")
      const yearPublished = getXmlAttr(xml, "yearpublished", "value")

      // Designer: look for link type="boardgamedesigner"
      const designerMatch = xml.match(/<link[^>]*type="boardgamedesigner"[^>]*value="([^"]*)"/)
      const designer = designerMatch ? designerMatch[1] : undefined

      return {
        externalId: id,
        externalSource: "bgg",
        externalUrl: `https://boardgamegeek.com/boardgame/${id}`,
        title,
        description: description ?? undefined,
        coverUrl,
        metadata: {
          minPlayers: minPlayers ? Number(minPlayers) : undefined,
          maxPlayers: maxPlayers ? Number(maxPlayers) : undefined,
          bggRating: ratingAvg ? Number(ratingAvg) : undefined,
          year: yearPublished ? Number(yearPublished) : undefined,
          designer,
        },
      }
    } catch {
      return null
    }
  },
}
