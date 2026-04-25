import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import path from "path"
import { mkdir, stat } from "fs/promises"
import { randomUUID } from "crypto"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads"

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

    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    await mkdir(UPLOAD_DIR, { recursive: true })

    const uuid = randomUUID()
    const filename = `${uuid}.webp`
    const thumbFilename = `${uuid}_thumb.webp`
    const filePath = path.join(UPLOAD_DIR, filename)
    const thumbPath = path.join(UPLOAD_DIR, thumbFilename)

    const sharp = (await import("sharp")).default
    const image = sharp(buffer)
    const metadata = await image.metadata()

    await image
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filePath)

    await sharp(buffer)
      .resize({ width: 300, height: 300, fit: "cover" })
      .webp({ quality: 80 })
      .toFile(thumbPath)

    const fileStat = await stat(filePath)

    const existingCount = await prisma.photo.count({ where: { itemId: id } })
    const isPrimary = existingCount === 0

    const photo = await prisma.photo.create({
      data: {
        itemId: id,
        filename,
        originalName: filename,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        size: fileStat.size,
        isPrimary,
        sortOrder: existingCount,
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to attach image" }, { status: 500 })
  }
}
