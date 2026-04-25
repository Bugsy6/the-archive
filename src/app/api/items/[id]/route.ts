import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ItemStatus, Condition } from "@prisma/client"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        collection: true,
        photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        tags: { include: { tag: true } },
      },
    })
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      title, subtitle, description, notes,
      collectionId, status, condition,
      externalId, externalSource, externalUrl,
      metadata, acquiredAt, acquiredFrom, pricePaid,
      tagIds,
    } = body

    const item = await prisma.item.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
        ...(collectionId !== undefined && { collectionId }),
        ...(status !== undefined && { status: status as ItemStatus }),
        ...(condition !== undefined && { condition: condition as Condition }),
        ...(externalId !== undefined && { externalId }),
        ...(externalSource !== undefined && { externalSource }),
        ...(externalUrl !== undefined && { externalUrl }),
        ...(metadata !== undefined && { metadata: JSON.stringify(metadata) }),
        ...(acquiredAt !== undefined && { acquiredAt: acquiredAt ? new Date(acquiredAt) : null }),
        ...(acquiredFrom !== undefined && { acquiredFrom }),
        ...(pricePaid !== undefined && { pricePaid }),
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId: string) => ({ tagId })),
          },
        }),
      },
      include: {
        collection: true,
        photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        tags: { include: { tag: true } },
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await prisma.item.findUnique({
      where: { id },
      include: { photos: true },
    })
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Delete photo files
    const { unlink } = await import("fs/promises")
    const path = await import("path")
    const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads"
    for (const photo of item.photos) {
      try {
        await unlink(path.join(UPLOAD_DIR, photo.filename))
      } catch {}
      // thumb
      try {
        const ext = path.extname(photo.filename)
        const base = photo.filename.slice(0, -ext.length)
        await unlink(path.join(UPLOAD_DIR, `${base}_thumb${ext}`))
      } catch {}
    }

    await prisma.item.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
