import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection: slug } = await params

    const collection = await prisma.collection.findUnique({ where: { slug } })
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const body = await req.json()
    const items: Array<{ title: string; description?: string }> = body.items

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const created: Array<{ id: string; title: string }> = []

    for (const item of items) {
      if (!item.title?.trim()) continue
      const record = await prisma.item.create({
        data: {
          title: item.title.trim(),
          description: item.description?.trim() || null,
          collectionId: collection.id,
          status: "OWNED",
          condition: "GOOD",
        },
      })
      created.push({ id: record.id, title: record.title })
    }

    return NextResponse.json({ count: created.length, items: created }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
}
