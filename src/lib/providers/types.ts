export interface SearchResult {
  externalId: string
  externalSource: string
  externalUrl?: string
  title: string
  subtitle?: string
  description?: string
  coverUrl?: string
  metadata?: Record<string, unknown>
}

export interface MetadataProvider {
  source: string
  collectionSlugs: string[]
  search(query: string): Promise<SearchResult[]>
  getById(id: string): Promise<SearchResult | null>
}
