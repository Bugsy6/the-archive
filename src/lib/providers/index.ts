import type { MetadataProvider } from "./types"
import { igdbProvider } from "./igdb"
import { openLibraryProvider } from "./openlibrary"
import { googleBooksProvider } from "./googlebooks"
import { bggProvider } from "./bgg"
import { comicVineProvider } from "./comicvine"
import { tmdbProvider } from "./tmdb"

function isProviderActive(provider: MetadataProvider): boolean {
  switch (provider.source) {
    case "igdb":
      return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET)
    case "googlebooks":
      return Boolean(process.env.GOOGLE_BOOKS_API_KEY)
    case "comicvine":
      return Boolean(process.env.COMICVINE_API_KEY)
    case "tmdb":
      return Boolean(process.env.TMDB_API_KEY)
    // openlibrary and bgg have no required env vars
    default:
      return true
  }
}

const allProviders: MetadataProvider[] = [
  igdbProvider,
  openLibraryProvider,
  googleBooksProvider,
  bggProvider,
  comicVineProvider,
  tmdbProvider,
]

export function getProvidersForCollection(collectionSlug: string): MetadataProvider[] {
  return allProviders.filter(
    (p) => p.collectionSlugs.includes(collectionSlug) && isProviderActive(p)
  )
}

export function getProviderBySource(source: string): MetadataProvider | undefined {
  return allProviders.find((p) => p.source === source && isProviderActive(p))
}

export { igdbProvider } from "./igdb"
export { openLibraryProvider } from "./openlibrary"
export { googleBooksProvider } from "./googlebooks"
export { bggProvider } from "./bgg"
export { comicVineProvider } from "./comicvine"
export { tmdbProvider } from "./tmdb"
export type { MetadataProvider, SearchResult } from "./types"
