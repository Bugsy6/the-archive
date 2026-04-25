import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [collections, statusCounts, conditionCounts, total] = await Promise.all([
      prisma.collection.findMany({
        include: { _count: { select: { items: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.item.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.item.groupBy({
        by: ["condition"],
        _count: { _all: true },
      }),
      prisma.item.count(),
    ])

    return NextResponse.json({
      total,
      byCollection: collections.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        count: c._count.items,
      })),
      byStatus: statusCounts.map((s) => ({ status: s.status, count: s._count._all })),
      byCondition: conditionCounts.map((c) => ({ condition: c.condition, count: c._count._all })),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
