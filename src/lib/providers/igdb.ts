import type { MetadataProvider, SearchResult } from "./types"

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getTwitchToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required")
  }

  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST", signal: controller.signal }
    )

    if (!res.ok) {
      throw new Error(`Twitch token fetch failed: ${res.status}`)
    }

    const data = await res.json()
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    }

    return tokenCache.token
  } finally {
    clearTimeout(timeout)
  }
}

async function igdbFetch(endpoint: string, body: string): Promise<unknown[]> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const token = await getTwitchToken()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: {
        "Client-ID": clientId!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body,
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`IGDB fetch failed: ${res.status}`)
    }

    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

function formatCoverUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const normalized = url.replace("t_thumb", "t_cover_big")
  return normalized.startsWith("//") ? `https:${normalized}` : normalized
}

function mapGame(game: Record<string, unknown>): SearchResult {
  const cover = game.cover as { url?: string } | undefined
  const platforms = game.platforms as Array<{ name: string }> | undefined
  const releaseDate = game.first_release_date as number | undefined

  return {
    externalId: String(game.id),
    externalSource: "igdb",
    externalUrl: game.url as string | undefined,
    title: game.name as string,
    description: game.summary as string | undefined,
    coverUrl: formatCoverUrl(cover?.url),
    metadata: {
      platform: platforms?.[0]?.name,
      year: releaseDate ? new Date(releaseDate * 1000).getFullYear() : undefined,
      igdbRating: game.total_rating,
    },
  }
}

export const igdbProvider: MetadataProvider = {
  source: "igdb",
  collectionSlugs: ["video-games", "consoles"],

  async search(query: string): Promise<SearchResult[]> {
    try {
      const data = await igdbFetch(
        "games",
        `search "${query}"; fields name,summary,cover.url,platforms.name,first_release_date,url,total_rating; limit 10;`
      )
      return (data as Array<Record<string, unknown>>).map(mapGame)
    } catch {
      return []
    }
  },

  async getById(id: string): Promise<SearchResult | null> {
    try {
      const data = await igdbFetch(
        "games",
        `fields name,summary,cover.url,platforms.name,first_release_date,url,total_rating; where id = ${id};`
      )
      const games = data as Array<Record<string, unknown>>
      if (!games.length) return null
      return mapGame(games[0])
    } catch {
      return null
    }
  },
}
