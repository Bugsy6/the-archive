"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_LABELS, STATUS_COLORS, CONDITION_LABELS } from "@/lib/types"
import { ItemStatus, Condition } from "@prisma/client"
import type { Tag } from "@prisma/client"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

interface FilterSidebarProps {
  tags: Tag[]
  collectionSlug: string
}

const ALL_STATUSES = Object.values(ItemStatus)
const ALL_CONDITIONS = Object.values(Condition)

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "createdAt_asc", label: "Oldest first" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
  { value: "updatedAt_desc", label: "Recently updated" },
]

export function FilterSidebar({ tags, collectionSlug }: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getParam = (key: string) => searchParams.get(key) ?? ""
  const getParamList = (key: string) =>
    searchParams.get(key)?.split(",").filter(Boolean) ?? []

  const selectedStatuses = getParamList("status")
  const selectedConditions = getParamList("condition")
  const selectedTags = getParamList("tags")
  const search = getParam("search")
  const sort = getParam("sort") || "createdAt_desc"

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("page")
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const toggleList = (key: string, current: string[], value: string) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    updateParams({ [key]: next.join(",") || null })
  }

  const hasFilters =
    selectedStatuses.length > 0 ||
    selectedConditions.length > 0 ||
    selectedTags.length > 0 ||
    search

  const clearAll = () => {
    router.push(pathname)
  }

  return (
    <aside className="w-56 shrink-0 space-y-5">
      {/* Sort */}
      <div>
        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
          Sort
        </Label>
        <Select
          value={sort}
          onValueChange={(v) => updateParams({ sort: v })}
        >
          <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-200">
            <SelectValue>
              {(value: string) => SORT_OPTIONS.find((o) => o.value === value)?.label ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-zinc-200">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-zinc-700" />

      {/* Search */}
      <div>
        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
          Search
        </Label>
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => updateParams({ search: e.target.value || null })}
          className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
        />
      </div>

      <Separator className="bg-zinc-700" />

      {/* Status */}
      <div>
        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
          Status
        </Label>
        <div className="space-y-2">
          {ALL_STATUSES.map((status) => (
            <label key={status} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={selectedStatuses.includes(status)}
                onCheckedChange={() => toggleList("status", selectedStatuses, status)}
              />
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-medium",
                  STATUS_COLORS[status]
                )}
              >
                {STATUS_LABELS[status]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-700" />

      {/* Condition */}
      <div>
        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
          Condition
        </Label>
        <div className="space-y-2">
          {ALL_CONDITIONS.map((cond) => (
            <label key={cond} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedConditions.includes(cond)}
                onCheckedChange={() => toggleList("condition", selectedConditions, cond)}
              />
              <span className="text-sm text-zinc-300">{CONDITION_LABELS[cond]}</span>
            </label>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <>
          <Separator className="bg-zinc-700" />
          <div>
            <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              Tags
            </Label>
            <div className="space-y-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleList("tags", selectedTags, tag.id)}
                  />
                  <span
                    className="text-sm text-zinc-300"
                    style={tag.color ? { color: tag.color } : undefined}
                  >
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {hasFilters && (
        <>
          <Separator className="bg-zinc-700" />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="w-full text-zinc-400 hover:text-zinc-200 gap-1.5"
          >
            <XIcon className="size-3.5" />
            Clear filters
          </Button>
        </>
      )}
    </aside>
  )
}
