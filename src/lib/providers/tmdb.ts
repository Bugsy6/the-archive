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

function mapMovie(movie: Record<string, unknown>): SearchResult {
  const posterPath = movie.poster_path as string | undefined
  const releaseDate = movie.release_date as string | undefined

  return {
    externalId: String(movie.id),
    externalSource: "tmdb",
    externalUrl: `https://www.themoviedb.org/movie/${movie.id}`,
    title: movie.title as string,
    subtitle: releaseDate ? releaseDate.slice(0, 4) : undefined,
    description: movie.overview as string | undefined,
    coverUrl: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : undefined,
    metadata: {
      year: releaseDate ? releaseDate.slice(0, 4) : undefined,
      tmdbRating: movie.vote_average,
      genres: movie.genre_ids,
    },
  }
}

export const tmdbProvider: MetadataProvider = {
  source: "tmdb",
  collectionSlugs: ["movies", "memorabilia"],

  async search(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) return []

    try {
      const res = await fetchWithTimeout(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
      )

      if (!res.ok) return []

      const data = await res.json()
      const results = data.results as Array<Record<string, unknown>> | undefined
      if (!results) return []

      return results.map(mapMovie)
    } catch {
      return []
    }
  },

  async getById(id: string): Promise<SearchResult | null> {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) return null

    try {
      const res = await fetchWithTimeout(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`
      )

      if (!res.ok) return null

      const data = await res.json()
      return mapMovie(data as Record<string, unknown>)
    } catch {
      return null
    }
  },
}
