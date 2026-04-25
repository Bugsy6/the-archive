import { prisma } from "@/lib/prisma"
import { AppSidebarClient } from "./AppSidebarClient"
import type { CollectionWithCount } from "@/lib/types"

export async function AppSidebar() {
  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { items: true } },
    },
  }) as CollectionWithCount[]

  return <AppSidebarClient collections={collections} />
}
