"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchIcon, ExternalLinkIcon, ChevronDownIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export interface ExternalSearchResult {
  title: string
  subtitle?: string
  description?: string
  coverUrl?: string
  metadata?: Record<string, unknown>
  externalId?: string
  externalSource?: string
  externalUrl?: string
}

interface ProviderInfo {
  source: string
  label: string
}

interface ExternalSearchModalProps {
  collectionSlug?: string
  onSelect: (result: ExternalSearchResult) => void
}

const SOURCE_LABELS: Record<string, string> = {
  igdb: "IGDB",
  openlibrary: "Open Library",
  googlebooks: "Google Books",
  bgg: "BoardGameGeek",
  comicvine: "Comic Vine",
  tmdb: "TMDB",
}

export function ExternalSearchModal({ collectionSlug, onSelect }: ExternalSearchModalProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ExternalSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [selectedSource, setSelectedSource] = useState<string>("")
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasProvider = providers.length > 0

  // Fetch providers for this collection when modal opens
  useEffect(() => {
    if (!open || !collectionSlug) return

    async function loadProviders() {
      try {
        const res = await fetch(`/api/search/providers?slug=${encodeURIComponent(collectionSlug!)}`)
        if (res.ok) {
          const data = await res.json()
          setProviders(data)
          if (data.length > 0 && !selectedSource) {
            setSelectedSource(data[0].source)
          }
        }
      } catch {
        // If the providers endpoint doesn't exist, fall back to a heuristic
        if (collectionSlug) {
          const heuristic = guessProviders(collectionSlug)
          setProviders(heuristic)
          if (heuristic.length > 0 && !selectedSource) {
            setSelectedSource(heuristic[0].source)
          }
        }
      }
    }

    loadProviders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collectionSlug])

  function guessProviders(slug: string): ProviderInfo[] {
    const map: Record<string, string[]> = {
      "video-games": ["igdb"],
      "consoles": ["igdb"],
      "books": ["openlibrary", "googlebooks"],
      "board-games": ["bgg"],
      "comics": ["comicvine"],
      "movies": ["tmdb"],
      "memorabilia": ["tmdb"],
    }
    const sources = map[slug] ?? []
    return sources.map((s) => ({ source: s, label: SOURCE_LABELS[s] ?? s }))
  }

  useEffect(() => {
    if (!query.trim() || !hasProvider || !selectedSource) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search/${encodeURIComponent(selectedSource)}?q=${encodeURIComponent(query.trim())}`
        )
        if (!res.ok) {
          setResults([])
          return
        }
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, hasProvider, selectedSource])

  // When source changes, re-run search if there's already a query
  useEffect(() => {
    if (!query.trim() || !selectedSource) return
    setResults([])
    setLoading(true)

    const controller = new AbortController()
    fetch(
      `/api/search/${encodeURIComponent(selectedSource)}?q=${encodeURIComponent(query.trim())}`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))

    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource])

  async function handleSelect(result: ExternalSearchResult) {
    if (!result.externalId || !result.externalSource) {
      onSelect(result)
      setOpen(false)
      setQuery("")
      setResults([])
      return
    }

    setLoadingDetail(result.externalId)
    try {
      const res = await fetch(
        `/api/search/${encodeURIComponent(result.externalSource)}/${encodeURIComponent(result.externalId)}`
      )
      if (res.ok) {
        const full = await res.json()
        onSelect(full)
      } else {
        onSelect(result)
      }
    } catch {
      onSelect(result)
    } finally {
      setLoadingDetail(null)
      setOpen(false)
      setQuery("")
      setResults([])
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) {
      setQuery("")
      setResults([])
      setLoadingDetail(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 border-zinc-700" />
        }
      >
        <SearchIcon className="size-3.5" />
        Search external
      </DialogTrigger>
      <DialogContent className="bg-zinc-800 border-zinc-700 max-w-lg">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">External Search</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Search external sources to pre-fill item details
            </p>
          </div>

          {/* Source selector */}
          {providers.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {providers.map((p) => (
                <button
                  key={p.source}
                  onClick={() => setSelectedSource(p.source)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedSource === p.source
                      ? "bg-zinc-600 text-zinc-100"
                      : "bg-zinc-700 text-zinc-400 hover:bg-zinc-650 hover:text-zinc-300"
                  }`}
                >
                  {p.label ?? SOURCE_LABELS[p.source] ?? p.source}
                </button>
              ))}
            </div>
          )}

          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-zinc-700 border-zinc-600 text-zinc-200 placeholder:text-zinc-500"
            autoFocus
          />

          {!hasProvider && (
            <div className="text-center py-6 text-zinc-500 text-sm">
              No search providers available for this collection
            </div>
          )}

          {hasProvider && loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-zinc-700">
                  <Skeleton className="size-12 rounded-lg shrink-0 bg-zinc-600" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4 bg-zinc-600" />
                    <Skeleton className="h-3 w-1/2 bg-zinc-600" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasProvider && !loading && query.trim() && results.length === 0 && (
            <div className="text-center py-6 text-zinc-500 text-sm">
              No results found
            </div>
          )}

          {hasProvider && !loading && results.length > 0 && (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {results.map((result, index) => {
                const itemId = result.externalId ?? String(index)
                const isLoadingThis = loadingDetail === result.externalId

                return (
                  <button
                    key={`${result.externalId}-${index}`}
                    onClick={() => handleSelect(result)}
                    disabled={loadingDetail !== null}
                    className="w-full flex gap-3 p-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors text-left disabled:opacity-60 disabled:cursor-wait"
                  >
                    {result.coverUrl ? (
                      <img
                        src={result.coverUrl}
                        alt={result.title}
                        className="size-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="size-12 rounded-lg bg-zinc-600 shrink-0 flex items-center justify-center">
                        <SearchIcon className="size-4 text-zinc-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-zinc-100 truncate">
                        {result.title}
                        {isLoadingThis && (
                          <span className="ml-2 text-xs text-zinc-400">Loading...</span>
                        )}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-zinc-400 truncate">{result.subtitle}</div>
                      )}
                      {result.description && (
                        <div className="text-xs text-zinc-500 truncate mt-0.5">
                          {result.description.replace(/<[^>]+>/g, "").slice(0, 100)}
                        </div>
                      )}
                      {result.externalSource && (
                        <div className="flex items-center gap-1 mt-1">
                          <ExternalLinkIcon className="size-3 text-zinc-500" />
                          <span className="text-xs text-zinc-500">
                            {SOURCE_LABELS[result.externalSource] ?? result.externalSource}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
