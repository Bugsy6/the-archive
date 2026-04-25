import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { ids } = body as { ids: string[] }

    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids must be an array" }, { status: 400 })
    }

    await Promise.all(
      ids.map((photoId, index) =>
        prisma.photo.updateMany({
          where: { id: photoId, itemId: id },
          data: { sortOrder: index },
        })
      )
    )

    const photos = await prisma.photo.findMany({
      where: { itemId: id },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    })

    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json({ error: "Failed to reorder photos" }, { status: 500 })
  }
}
