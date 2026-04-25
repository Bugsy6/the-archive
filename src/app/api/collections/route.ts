import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    })
    return NextResponse.json(collections)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, icon, description } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const existing = await prisma.collection.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }

    const collection = await prisma.collection.create({
      data: { name, slug, icon: icon ?? null, description: description ?? null },
    })
    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 })
  }
}
