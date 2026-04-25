export type {
  Collection,
  Item,
  Photo,
  Tag,
  ItemTag,
} from "@prisma/client"
export { ItemStatus, Condition } from "@prisma/client"

import type { Collection, Item, Photo, Tag, ItemTag } from "@prisma/client"
import { ItemStatus, Condition } from "@prisma/client"

export type CollectionWithCount = Collection & { _count: { items: number } }
export type ItemWithRelations = Item & {
  collection: Collection
  photos: Photo[]
  tags: (ItemTag & { tag: Tag })[]
}

export const STATUS_LABELS: Record<ItemStatus, string> = {
  OWNED: "Owned",
  WANTED: "Wanted",
  WISHLIST: "Wishlist",
  FOR_SALE: "For Sale",
  SOLD: "Sold",
  LOANED_OUT: "Loaned Out",
  MISSING: "Missing",
}

export const CONDITION_LABELS: Record<Condition, string> = {
  MINT: "Mint",
  NEAR_MINT: "Near Mint",
  VERY_GOOD: "Very Good",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
  DAMAGED: "Damaged",
}

export const STATUS_COLORS: Record<ItemStatus, string> = {
  OWNED: "bg-green-500/20 text-green-400",
  WANTED: "bg-blue-500/20 text-blue-400",
  WISHLIST: "bg-purple-500/20 text-purple-400",
  FOR_SALE: "bg-yellow-500/20 text-yellow-400",
  SOLD: "bg-gray-500/20 text-gray-400",
  LOANED_OUT: "bg-orange-500/20 text-orange-400",
  MISSING: "bg-red-500/20 text-red-400",
}
