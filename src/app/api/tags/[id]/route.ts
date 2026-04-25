import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    })
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }
    return NextResponse.json(tag)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tag" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, color } = body

    const tag = await prisma.tag.findUnique({ where: { id } })
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined && {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        }),
        ...(color !== undefined && { color }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tag = await prisma.tag.findUnique({ where: { id } })
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }
    await prisma.tag.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 })
  }
}
