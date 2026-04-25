import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import path from "path"
import { unlink } from "fs/promises"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, itemId: id },
    })
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Delete files
    try {
      await unlink(path.join(UPLOAD_DIR, photo.filename))
    } catch {}
    try {
      const ext = path.extname(photo.filename)
      const base = photo.filename.slice(0, -ext.length)
      await unlink(path.join(UPLOAD_DIR, `${base}_thumb${ext}`))
    } catch {}

    await prisma.photo.delete({ where: { id: photoId } })

    // If deleted photo was primary, promote next one
    if (photo.isPrimary) {
      const next = await prisma.photo.findFirst({
        where: { itemId: id },
        orderBy: { sortOrder: "asc" },
      })
      if (next) {
        await prisma.photo.update({ where: { id: next.id }, data: { isPrimary: true } })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params
    const body = await req.json()
    const { sortOrder, isPrimary } = body

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, itemId: id },
    })
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    if (isPrimary === true) {
      // Clear existing primary
      await prisma.photo.updateMany({
        where: { itemId: id },
        data: { isPrimary: false },
      })
    }

    const updated = await prisma.photo.update({
      where: { id: photoId },
      data: {
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 })
  }
}
