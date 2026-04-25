import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import path from "path"
import { mkdir, writeFile } from "fs/promises"
import { randomUUID } from "crypto"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const photos = await prisma.photo.findMany({
      where: { itemId: id },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    })
    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const item = await prisma.item.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const uuid = randomUUID()
    const filename = `${uuid}.webp`
    const thumbFilename = `${uuid}_thumb.webp`
    const filePath = path.join(UPLOAD_DIR, filename)
    const thumbPath = path.join(UPLOAD_DIR, thumbFilename)

    // Process with sharp
    const sharp = (await import("sharp")).default
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Full size (max 1200px)
    await image
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filePath)

    // Thumbnail (300px)
    await sharp(buffer)
      .resize({ width: 300, height: 300, fit: "cover" })
      .webp({ quality: 80 })
      .toFile(thumbPath)

    const stat = await import("fs/promises").then(m => m.stat(filePath))

    // Count existing photos to determine sort order
    const existingCount = await prisma.photo.count({ where: { itemId: id } })
    const isPrimary = existingCount === 0

    const photo = await prisma.photo.create({
      data: {
        itemId: id,
        filename,
        originalName: file.name,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        size: stat.size,
        isPrimary,
        sortOrder: existingCount,
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
}
