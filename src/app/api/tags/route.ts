import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const collectionId = searchParams.get("collectionId")

    const tags = await prisma.tag.findMany({
      where: collectionId ? { collectionId } : undefined,
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    })
    return NextResponse.json(tags)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, color, collectionId } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    const existing = await prisma.tag.findFirst({
      where: { slug, collectionId: collectionId ?? null },
    })
    if (existing) {
      return NextResponse.json({ error: "Tag with this name already exists in collection" }, { status: 409 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        color: color ?? null,
        collectionId: collectionId ?? null,
      },
    })
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
  }
}
