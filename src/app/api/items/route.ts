import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ItemStatus, Condition } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const collectionSlug = searchParams.get("collection")
    const status = searchParams.get("status")
    const condition = searchParams.get("condition")
    const tags = searchParams.get("tags")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "24", 10)
    const sort = searchParams.get("sort") ?? "createdAt_desc"

    const [sortField, sortDir] = sort.split("_") as [string, "asc" | "desc"]

    const where: Record<string, unknown> = {}

    if (collectionSlug) {
      const collection = await prisma.collection.findUnique({ where: { slug: collectionSlug } })
      if (collection) where.collectionId = collection.id
    }
    if (status) where.status = status as ItemStatus
    if (condition) where.condition = condition as Condition
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { subtitle: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (tags) {
      const tagIds = tags.split(",")
      where.tags = { some: { tagId: { in: tagIds } } }
    }

    const orderBy: Record<string, unknown> = {}
    if (sortField === "title" || sortField === "createdAt" || sortField === "updatedAt" || sortField === "acquiredAt") {
      orderBy[sortField] = sortDir ?? "asc"
    } else {
      orderBy.createdAt = "desc"
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          collection: true,
          photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
          tags: { include: { tag: true } },
        },
      }),
      prisma.item.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      title, subtitle, description, notes,
      collectionId, status, condition,
      externalId, externalSource, externalUrl,
      metadata, acquiredAt, acquiredFrom, pricePaid,
      tagIds,
    } = body

    if (!title || !collectionId) {
      return NextResponse.json({ error: "Title and collectionId are required" }, { status: 400 })
    }

    const item = await prisma.item.create({
      data: {
        title,
        subtitle: subtitle ?? null,
        description: description ?? null,
        notes: notes ?? null,
        collectionId,
        status: (status as ItemStatus) ?? ItemStatus.OWNED,
        condition: (condition as Condition) ?? Condition.GOOD,
        externalId: externalId ?? null,
        externalSource: externalSource ?? null,
        externalUrl: externalUrl ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        acquiredAt: acquiredAt ? new Date(acquiredAt) : null,
        acquiredFrom: acquiredFrom ?? null,
        pricePaid: pricePaid ?? null,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
      },
      include: {
        collection: true,
        photos: true,
        tags: { include: { tag: true } },
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
