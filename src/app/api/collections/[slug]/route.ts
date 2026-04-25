import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const collection = await prisma.collection.findUnique({
      where: { slug },
      include: { _count: { select: { items: true } } },
    })
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }
    return NextResponse.json(collection)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()
    const { name, icon, description, slug: newSlug } = body

    const collection = await prisma.collection.findUnique({ where: { slug } })
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    if (newSlug && newSlug !== slug) {
      const existing = await prisma.collection.findUnique({ where: { slug: newSlug } })
      if (existing) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    const updated = await prisma.collection.update({
      where: { slug },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(description !== undefined && { description }),
        ...(newSlug !== undefined && { slug: newSlug }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const collection = await prisma.collection.findUnique({ where: { slug } })
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    await prisma.collection.delete({ where: { slug } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 })
  }
}
